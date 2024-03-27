//!native
//!nonstrict
//!optimize 2

export type Listener<T = unknown> = (withValue: { value: T }) => void;
export type Listeners<T = unknown> = Set<Listener<T>>;
export interface ContextNextValue<T> {
	readonly listeners: Listeners<T>;
	value: T;
}

export type NextContextProvider<T> = (properties: {
	readonly children: React.ReactNode;
	readonly value: T;
}) => React.FunctionComponentElement<React.ProviderProps<ContextNextValue<T>>>;

export interface NextContext<T> extends Omit<React.Context<T>, "Provider"> {
	[ORIGINAL_PROVIDER: symbol]: NextContextProvider<T>;
	Provider: NextContextProvider<T>;
}
