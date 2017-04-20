let React    = require('react');
let ReactDOM = require('react-dom');
let Relay = require('react-relay');

class Item extends React.Component {
	render() {
		let item = this.props.store;

		return (
			<div>
				<h1><a href={item.url}>{item.title}</a></h1>
				<h2>{item.score} - {item.by.id}</h2>
				<hr />
			</div>
		);
	}
};

// wrapping in higher-order component
// - redefine my Item component as a new component which wraps the original in a container
// For the component's `store` prop, I need the data described in this GraphQL fragment

// I know I need it on a "HackerNewsAPI" object because I explored the API
// via http://GraphQLHub.com/playground/hn.

// fragment are analogous to alias/symlinks in a query, and are NOT the final query for how to fetch all the data.
Item = Relay.createContainer(Item, {
	fragments: {
		store: () => Relay.QL`
			fragment on HackerNewsItem {
				id,
				title,
				score,
				url
				by {
					id
				}
			}
		`
	}
})

// showing a list of top items, resembles the fornt page of hacker news
class TopItems extends React.Component {
	_onChange(ev) {
		let storyType = ev.target.value
		this.setState({ storyType })
		this.props.relay.setVariables({
			storyType
		})
	}

	render() {
		let items = this.props.store.stories.map(
			(store, idx) => <Item store={store} key={idx} />
		);
		let variables = this.props.relay.variables

		// To reduce the perceived lag
		// There are less crude ways of doing this, but this works for now
		let currentStoryType = (this.state && this.state.storyType) || variables.storyType

		return <div>
			<select onChange={this._onChange.bind(this)} value={currentStoryType}>
        <option value="top">Top</option>
        <option value="new">New</option>
        <option value="ask">Ask HN</option>
        <option value="show">Show HN</option>
      </select>
			{ items }
		</div>;
	}
}

// now we can request 'topStories' instead of one item
TopItems = Relay.createContainer(TopItems, {
	initialVariables: {
		storyType: 'top'
	},
	fragments: {
		// $storyType denotes a graphql variable
		store: () => Relay.QL`
			fragment on HackerNewsAPI {
				stories(storyType: $storyType) { ${Item.getFragment('store')} },
			}
		`,
	},
})


// We do need a finalized `GraphQL` query, which is where Relay Route get used, it is a 'root query'?? which bootstraps our data requests
class HackerNewsRoute extends Relay.Route {
	static routeName = 'HackerNewsRoute'
	static queries = {
		store: ((Component) => {
			return Relay.QL`
				query root {
					hn { ${Component.getFragment('store')} },
				}
			`
		})
	}
}

Relay.injectNetworkLayer(
	new Relay.DefaultNetworkLayer('https://www.GraphQLHub.com/graphql')
)

let mountNode = document.getElementById('container');
// the relay root container is the top level component which kicks off a query with a component hierarchy.
let rootComponent = <Relay.RootContainer
	Component={TopItems}
	route={new HackerNewsRoute()}
/>

ReactDOM.render(rootComponent, mountNode);
