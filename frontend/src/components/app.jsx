
import "preact/debug";
import { StateProvider } from '/lib/state';
import { middleware, observers, reducer, initialState } from '../reducers';
import { Icon } from './index.jsx';

import hydrate from 'preact-iso/hydrate';

import ErrorBoundary from './error_boundary'

import Routes from './routes';
import { useMemo } from 'preact/hooks';

export default function App() {

	Icon.load(new URL('../assets/atlas/index.svg', import.meta.url).href);

	return <ErrorBoundary>
		<StateProvider initialState={initialState} reducer={reducer} observers={observers} middleware={middleware}>
			<div id="app">
				<Routes />
			</div>
		</StateProvider>
	</ErrorBoundary>
}
