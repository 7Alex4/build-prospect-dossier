export type OptionKind = "boolean" | "value";
export type ParsedOptions = ReadonlyMap<string, string | true>;
export interface ParsedCli {
    readonly options: ParsedOptions;
    readonly positionals: readonly string[];
}
export declare function parseCli(arguments_: readonly string[], specification: Readonly<Record<string, OptionKind>>): ParsedCli;
export declare function optionValue(options: ParsedOptions, name: string): string | undefined;
export declare function optionFlag(options: ParsedOptions, name: string): boolean;
export declare function requireSinglePositional(positionals: readonly string[], usage: string): string;
