/**
 * Multi-Hop Path Finding Tests
 * 
 * Tests the BFS path finding algorithm for multi-hop queries.
 * 
 * Run with: node dist/tests/multi-hop-paths.test.js
 */

const Database = require('better-sqlite3');
const { EntityStore } = require('../dist/storage/entity-store');
const { RelationshipStore } = require('../dist/storage/relationship-store');
const { findPaths, findPathsByName, scorePath, rankPaths } = require('../dist/retrieval/graph-traversal');

// ============================================================================
// TEST SETUP
// ============================================================================

// Create in-memory database for testing
const db = new Database(':memory:');
const entityStore = new EntityStore(db);
const relationshipStore = new RelationshipStore(db);

// Test data
const TEST_ENTITIES = [
  { name: 'Alice', type: 'person' },
  { name: 'Bob', type: 'person' },
  { name: 'Carol', type: 'person' },
  { name: 'David', type: 'person' },
  { name: 'Acme Corp', type: 'organization' },
  { name: 'Tech Inc', type: 'organization' },
];

function setupTestData() {
  // Add entities
  for (const e of TEST_ENTITIES) {
    entityStore.addEntity(e);
  }
  
  // Add relationships
  const alice = entityStore.getByName('Alice');
  const bob = entityStore.getByName('Bob');
  const carol = entityStore.getByName('Carol');
  const david = entityStore.getByName('David');
  const acme = entityStore.getByName('Acme Corp');
  const tech = entityStore.getByName('Tech Inc');
  
  // Alice -> Bob (knows)
  relationshipStore.addRelationship({
    source: alice.id,
    target: bob.id,
    type: 'knows',
    timestamp: new Date().toISOString(),
    sessionId: 'test',
    confidence: 1.0
  });
  
  // Bob -> Carol (works_at)
  relationshipStore.addRelationship({
    source: bob.id,
    target: carol.id,
    type: 'works_at',
    timestamp: new Date().toISOString(),
    sessionId: 'test',
    confidence: 1.0
  });
  
  // Carol -> Acme Corp (employs)
  relationshipStore.addRelationship({
    source: acme.id,
    target: carol.id,
    type: 'employs',
    timestamp: new Date().toISOString(),
    sessionId: 'test',
    confidence: 1.0
  });
  
  // David -> Tech Inc (works_at)
  relationshipStore.addRelationship({
    source: david.id,
    target: tech.id,
    type: 'works_at',
    timestamp: new Date().toISOString(),
    sessionId: 'test',
    confidence: 1.0
  });
}

// ============================================================================
// TEST HELPERS
// ============================================================================

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ ${message}`);
    testsFailed++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    console.log(`  ✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ ${message} (expected: ${JSON.stringify(expected)}, got: ${JSON.stringify(actual)})`);
    testsFailed++;
  }
}

function assertGreaterThan(actual, min, message) {
  if (actual > min) {
    console.log(`  ✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ ${message} (expected: > ${min}, got: ${actual})`);
    testsFailed++;
  }
}

// ============================================================================
// TESTS
// ============================================================================

function testDirectPath() {
  console.log('\n--- Test: Direct Path (1-hop) ---');
  
  const alice = entityStore.getByName('Alice');
  const bob = entityStore.getByName('Bob');
  
  const paths = findPaths(alice.id, bob.id, relationshipStore);
  
  assertEqual(paths.length, 1, 'Should find 1 path');
  assertEqual(paths[0].length, 1, 'Path should be 1 hop');
  assertEqual(paths[0].segments[0].type, 'knows', 'Relationship type should be knows');
}

function testTwoHopPath() {
  console.log('\n--- Test: 2-Hop Path ---');
  
  const alice = entityStore.getByName('Alice');
  const carol = entityStore.getByName('Carol');
  
  const paths = findPaths(alice.id, carol.id, relationshipStore);
  
  assertGreaterThan(paths.length, 0, 'Should find at least 1 path');
  assertEqual(paths[0].length, 2, 'Shortest path should be 2 hops');
  
  // Verify path: Alice -> Bob -> Carol
  const firstPath = paths[0];
  const bob = entityStore.getByName('Bob');
  assertEqual(firstPath.segments[0].source, alice.id, 'First segment starts from Alice');
  assertEqual(firstPath.segments[0].target, bob.id, 'First segment goes to Bob');
  assertEqual(firstPath.segments[1].source, bob.id, 'Second segment starts from Bob');
  assertEqual(firstPath.segments[1].target, carol.id, 'Second segment goes to Carol');
}

function testThreeHopPath() {
  console.log('\n--- Test: 3-Hop Path ---');
  
  // Add a connection to make a 3-hop path: Alice -> Bob -> David
  const aliceEnt = entityStore.getByName('Alice');
  const bobEnt = entityStore.getByName('Bob');
  const davidEnt = entityStore.getByName('David');
  
  // Add: Bob knows David
  relationshipStore.addRelationship({
    source: bobEnt.id,
    target: davidEnt.id,
    type: 'knows',
    timestamp: new Date().toISOString(),
    sessionId: 'test',
    confidence: 1.0
  });
  
  // Now find path: Alice -> Bob -> David (2 hops)
  const paths = findPaths(aliceEnt.id, davidEnt.id, relationshipStore, { maxHops: 3 });
  
  assertGreaterThan(paths.length, 0, 'Should find path to David');
  
  // Should find the shorter path first
  const shortestPath = paths[0];
  assertEqual(shortestPath.length, 2, 'Shortest path should be 2 hops via Bob');
}

function testNoPath() {
  console.log('\n--- Test: No Path Exists ---');
  
  const carol = entityStore.getByName('Carol');
  const david = entityStore.getByName('David');
  
  // These have no connection in our test graph
  const paths = findPaths(carol.id, david.id, relationshipStore);
  
  assertEqual(paths.length, 0, 'Should find no paths');
}

function testContradictedRelationship() {
  console.log('\n--- Test: Contradicted Relationship (supersededBy) ---');
  
  // Create entities for this test
  const ent1 = entityStore.addEntity({ name: 'TestPerson1', type: 'person' });
  const ent2 = entityStore.addEntity({ name: 'TestPerson2', type: 'person' });
  
  // Add initial relationship
  const result1 = relationshipStore.addRelationship({
    source: ent1.id,
    target: ent2.id,
    type: 'knows',
    value: 'old-value',
    timestamp: '2025-01-01T00:00:00Z',
    sessionId: 'test',
    confidence: 1.0
  });
  
  // Add contradicting relationship (different value, same type)
  const result2 = relationshipStore.addRelationship({
    source: ent1.id,
    target: ent2.id,
    type: 'knows',
    value: 'new-value', // Different value
    timestamp: '2026-01-01T00:00:00Z', // Newer timestamp
    sessionId: 'test',
    confidence: 1.0
  });
  
  // The first relationship should now be superseded
  const supersededRel = relationshipStore.getById(result1.relationship.id);
  assert(supersededRel?.supersededBy !== undefined, 'Old relationship should be superseded');
  
  // Find paths - should skip the superseded relationship
  const paths = findPaths(ent1.id, ent2.id, relationshipStore);
  
  // Should still find a path via the new (non-superseded) relationship
  assertGreaterThan(paths.length, 0, 'Should find path with non-superseded relationship');
}

function testMaxHopsLimit() {
  console.log('\n--- Test: Max Hops Limit ---');
  
  const alice = entityStore.getByName('Alice');
  const david = entityStore.getByName('David');
  
  // With maxHops = 1, should not find path
  const paths1 = findPaths(alice.id, david.id, relationshipStore, { maxHops: 1 });
  assertEqual(paths1.length, 0, 'Should not find path with maxHops=1');
  
  // With maxHops = 2, should find path
  const paths2 = findPaths(alice.id, david.id, relationshipStore, { maxHops: 2 });
  assertGreaterThan(paths2.length, 0, 'Should find path with maxHops=2');
}

function testMaxPathsLimit() {
  console.log('\n--- Test: Max Paths Limit ---');
  
  const alice = entityStore.getByName('Alice');
  const david = entityStore.getByName('David');
  
  // Add multiple paths
  const bob = entityStore.getByName('Bob');
  const carol = entityStore.getByName('Carol');
  const acme = entityStore.getByName('Acme Corp');
  
  // Alice -> Carol (direct)
  relationshipStore.addRelationship({
    source: alice.id,
    target: carol.id,
    type: 'knows',
    timestamp: new Date().toISOString(),
    sessionId: 'test',
    confidence: 1.0
  });
  
  // Alice -> Acme -> David
  relationshipStore.addRelationship({
    source: alice.id,
    target: acme.id,
    type: 'part_of',
    timestamp: new Date().toISOString(),
    sessionId: 'test',
    confidence: 1.0
  });
  
  const paths = findPaths(alice.id, david.id, relationshipStore, { maxHops: 3, maxPaths: 2 });
  
  // Should limit to maxPaths
  assert(paths.length <= 2, 'Should limit to maxPaths');
}

function testPathScoring() {
  console.log('\n--- Test: Path Scoring ---');
  
  const alice = entityStore.getByName('Alice');
  const carol = entityStore.getByName('Carol');
  
  // Add a low-confidence relationship
  const bob = entityStore.getByName('Bob');
  relationshipStore.addRelationship({
    source: alice.id,
    target: bob.id,
    type: 'knows',
    timestamp: new Date().toISOString(),
    sessionId: 'test',
    confidence: 0.5  // Low confidence
  });
  
  const paths = findPaths(alice.id, carol.id, relationshipStore);
  
  if (paths.length > 0) {
    const score = scorePath(paths[0], relationshipStore, entityStore);
    assertGreaterThan(score, 0, 'Score should be positive');
    console.log(`    Path score: ${score.toFixed(4)}`);
  } else {
    console.log('    (No paths found, skipping score test)');
  }
}

function testFindPathsByName() {
  console.log('\n--- Test: Find Paths By Name ---');
  
  const paths = findPathsByName('Alice', 'Bob', entityStore, relationshipStore);
  
  assertEqual(paths.length, 1, 'Should find 1 path by name');
  assertEqual(paths[0].length, 1, 'Path should be 1 hop');
}

function testRankPaths() {
  console.log('\n--- Test: Rank Paths ---');
  
  const alice = entityStore.getByName('Alice');
  const david = entityStore.getByName('David');
  
  const paths = findPaths(alice.id, david.id, relationshipStore, { maxHops: 3 });
  const rankedPaths = rankPaths(paths, relationshipStore, entityStore);
  
  // Shorter paths should be ranked higher
  if (rankedPaths.length > 1) {
    assert(rankedPaths[0].length <= rankedPaths[1].length, 'Shorter paths should be ranked first');
  }
}

// ============================================================================
// RUN TESTS
// ============================================================================

function runTests() {
  console.log('========================================');
  console.log('Multi-Hop Path Finding Tests');
  console.log('========================================');
  
  // Setup
  setupTestData();
  
  // Run tests
  testDirectPath();
  testTwoHopPath();
  testThreeHopPath();
  testNoPath();
  testContradictedRelationship();
  testMaxHopsLimit();
  testMaxPathsLimit();
  testPathScoring();
  testFindPathsByName();
  testRankPaths();
  
  // Summary
  console.log('\n========================================');
  console.log(`Tests Passed: ${testsPassed}`);
  console.log(`Tests Failed: ${testsFailed}`);
  console.log('========================================');
  
  // Exit with error code if tests failed
  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests();
