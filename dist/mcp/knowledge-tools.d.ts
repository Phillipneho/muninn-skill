export declare const KNOWLEDGE_TOOLS: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            type: {
                type: string;
                enum: string[];
                description: string;
            };
            limit: {
                type: string;
                description: string;
                default: number;
            };
            entity?: undefined;
            direction?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            entity: {
                type: string;
                description: string;
            };
            type: {
                type: string;
                enum: string[];
                description: string;
            };
            direction: {
                type: string;
                enum: string[];
                description: string;
                default: string;
            };
            limit?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            entity: {
                type: string;
                description: string;
            };
            type: {
                type: string;
                description: string;
                enum?: undefined;
            };
            limit?: undefined;
            direction?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            type?: undefined;
            limit?: undefined;
            entity?: undefined;
            direction?: undefined;
        };
        required?: undefined;
    };
})[];
export declare const KNOWLEDGE_HANDLERS: {
    knowledge_entities: (store: any, args: any) => {
        count: any;
        entities: any;
    };
    knowledge_relationships: (store: any, args: any) => {
        count: number;
        relationships: never[];
        error: string;
    } | {
        count: number;
        relationships: {
            id: any;
            source: any;
            target: any;
            type: any;
            value: any;
            timestamp: any;
            confidence: any;
            supersededBy: any;
        }[];
        error?: undefined;
    };
    knowledge_history: (store: any, args: any) => {
        count: number;
        history: never[];
        error: string;
        entity?: undefined;
    } | {
        entity: any;
        count: any;
        history: any;
        error?: undefined;
    };
    knowledge_contradictions: (store: any, args: any) => {
        count: any;
        contradictions: any;
    };
};
//# sourceMappingURL=knowledge-tools.d.ts.map