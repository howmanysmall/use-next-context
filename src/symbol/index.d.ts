declare const Symbol: {
	(name?: string): symbol;
	for: (name?: string) => symbol;
} & Record<string, symbol>;

export = Symbol;
