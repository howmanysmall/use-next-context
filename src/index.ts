//!native
//!nonstrict
//!optimize 2

import React, {
	createContext,
	createElement,
	useContext,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "@rbxts/react";
import objectIs from "./object-is";
import Symbol from "./symbol";
import type { ContextNextValue, Listener, NextContext } from "./types";

const PROVIDER_NAME = "@use-context-next";
const ORIGINAL_PROVIDER = Symbol("ORIGINAL_PROVIDER");

function createNextProvider<Value>(ReactProvider: React.Provider<ContextNextValue<Value>>) {
	function ContextProvider({ children, value }: { children: React.ReactNode; value: Value }) {
		const listeners = new Set<Listener>();
		const contextValue = useRef<ContextNextValue<Value>>({ listeners, value });

		function triggerListeners() {
			const current = contextValue.current;
			if (current) for (const listener of current.listeners) listener({ value });
		}

		function triggerEffect() {
			contextValue.current.value = value;
			triggerListeners();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
		useEffect(triggerEffect, [value]);

		return createElement(ReactProvider, { value: contextValue.current }, children);
	}

	return ContextProvider;
}

namespace UseNextContext {
	/**
	 * Used to create a `NextContext`, which is used nearly identically to a regular React Context.
	 *
	 * @example
	 * interface State {
	 * 	readonly time: number;
	 * }
	 *
	 * export const TimeProvider = createNextContext<State>({
	 * 	time: 0,
	 * });
	 *
	 * function selectTime(state: State) {
	 * 	return state.time;
	 * }
	 *
	 * export function useTime() {
	 * 	return useContextSelector(TimeProvider, selectTime);
	 * }
	 *
	 * @param defaultValue
	 * @returns
	 */
	export function createNextContext<Value>(defaultValue: Value) {
		const context = createContext<ContextNextValue<Value>>({
			listeners: new Set<Listener>(),
			value: defaultValue,
		} as ContextNextValue<Value>);

		const nextContext = context as unknown as NextContext<Value>;

		nextContext.Provider = createNextProvider<Value>(context.Provider);
		(nextContext as never as { [ORIGINAL_PROVIDER: symbol]: unknown })[ORIGINAL_PROVIDER] = context.Provider;

		nextContext.displayName = PROVIDER_NAME;
		return nextContext;
	}

	/**
	 * Used to select a value from a `NextContext`.
	 *
	 * @param context
	 * @param selector
	 * @param comparator
	 * @returns
	 */
	export function useContextSelector<Value, Output>(
		context: NextContext<Value>,
		selector: (value: Value) => Output,
		comparator: (value0: unknown, value1: unknown) => boolean = objectIs,
	) {
		const contextValue = useContext<ContextNextValue<Value>>(
			context as unknown as React.Context<ContextNextValue<Value>>,
		);

		const initialValue = selector(contextValue.value);
		const [state, setState] = useState<Output>(initialValue);

		const { listeners } = contextValue;

		function update({ value }: { value: Value }) {
			const selected = selector(value);
			setState((previousState) => {
				if (!comparator(selected, previousState)) return selected;
				return previousState;
			});
		}

		// make this a named function so we get useful debug info
		// instead of "anonymous function" nonsense
		function listenLayoutEffect() {
			listeners.add(update);
			return () => {
				listeners.delete(update);
			};
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
		useLayoutEffect(listenLayoutEffect, [listeners]);

		return state;
	}
}

export = UseNextContext;
