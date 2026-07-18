import { UserInputError } from "./core.js";
export function parseCli(arguments_, specification) {
    const options = new Map();
    const positionals = [];
    let index = 0;
    while (index < arguments_.length) {
        const token = arguments_[index];
        if (token === undefined) {
            break;
        }
        if (token === "--") {
            index += 1;
            continue;
        }
        if (!token.startsWith("--")) {
            positionals.push(token);
            index += 1;
            continue;
        }
        const separatorIndex = token.indexOf("=");
        const name = token.slice(2, separatorIndex === -1 ? undefined : separatorIndex);
        const kind = specification[name];
        if (kind === undefined) {
            throw new UserInputError(`Unknown option: --${name}`);
        }
        if (options.has(name)) {
            throw new UserInputError(`Option may only be provided once: --${name}`);
        }
        if (kind === "boolean") {
            if (separatorIndex !== -1) {
                throw new UserInputError(`Boolean option does not accept a value: --${name}`);
            }
            options.set(name, true);
            index += 1;
            continue;
        }
        const inlineValue = separatorIndex === -1 ? undefined : token.slice(separatorIndex + 1);
        const nextValue = arguments_[index + 1];
        const value = inlineValue ?? nextValue;
        if (value === undefined || value.length === 0 || (inlineValue === undefined && value.startsWith("--"))) {
            throw new UserInputError(`Missing value for --${name}`);
        }
        options.set(name, value);
        index += inlineValue === undefined ? 2 : 1;
    }
    return { options, positionals };
}
export function optionValue(options, name) {
    const value = options.get(name);
    return typeof value === "string" ? value : undefined;
}
export function optionFlag(options, name) {
    return options.get(name) === true;
}
export function requireSinglePositional(positionals, usage) {
    const positional = positionals[0];
    if (positionals.length !== 1 || positional === undefined) {
        throw new UserInputError(`Expected exactly one path. Usage: ${usage}`);
    }
    return positional;
}
//# sourceMappingURL=cli.js.map