import React from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import styles from "../style.css";
import {Bond} from 'oo7';
import {ReactiveComponent, RRaisedButton, Rspan, TextBond} from 'oo7-react';
import {Transaction, formatBalance, isNullData, removeSigningPrefix} from 'oo7-parity';
import {TransactionProgressBadge, AccountIcon} from 'parity-reactive-ui';

const CounterCode = '0x6060604052341561000c57fe5b5b6104a88061001c6000396000f300606060405263ffffffff60e060020a60003504166309eef43e811461004d5780635df813301461007d57806394c21ff3146100a2578063b876a628146100c4578063bebc479c146100e5575bfe5b341561005557fe5b610069600160a060020a0360043516610175565b604080519115158252519081900360200190f35b341561008557fe5b61009060043561018a565b60408051918252519081900360200190f35b34156100aa57fe5b61009061019c565b60408051918252519081900360200190f35b34156100cc57fe5b6100e360043560ff60243516604435606435610251565b005b34156100ed57fe5b6100f561041c565b60408051602080825283518183015283519192839290830191850190808383821561013b575b80518252602083111561013b57601f19909201916020918201910161011b565b505050905090810190601f1680156101675780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b60016020526000908152604090205460ff1681565b60006020819052908152604090205481565b6040805160608101825260328082527f19457468657265756d205369676e6564204d6573736167653a0a32324920616d602083019081527f20656c696769626c6520746f20766f7465210000000000000000000000000000838501529251919282918083835b602083106102215780518252601f199092019160209182019101610202565b6001836020036101000a038019825116818451168082178552505050505050905001915050604051809103902081565b3383838383600160a060020a03166001606060405190810160405280603281526020017f19457468657265756d205369676e6564204d6573736167653a0a32324920616d81526020017f20656c696769626c6520746f20766f74652100000000000000000000000000008152506040518082805190602001908083835b602083106102ed5780518252601f1990920191602091820191016102ce565b51815160209384036101000a60001901801990921691161790526040805192909401829003822060008381528383018652928501839052845190815260ff8c16818301528085018b9052606081018a9052935160808086019750919550601f19810194819003909101925090866161da5a03f1151561036857fe5b505060206040510351600160a060020a0316141561040b57600160a060020a03331660009081526001602052604090205460ff16156103a75760006000fd5b60008881526020818152604080832080546001908101909155600160a060020a03331680855292819052818420805460ff19169091179055518a927f4d99b957a2bc29a30ebd96a7be8e68fe50a3c701db28a91436490b7d53870ca491a35b610411565b60006000fd5b5b5050505050505050565b606060405190810160405280603281526020017f19457468657265756d205369676e6564204d6573736167653a0a32324920616d81526020017f20656c696769626c6520746f20766f7465210000000000000000000000000000815250815600a165627a7a72305820238cb0019a9db164baca03cc247a23f175141a78bb795d73900d12ee471847860029';
const CounterABI = [{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"hasVoted","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"votes","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"STATEMENT_HASH","outputs":[{"name":"","type":"bytes32"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_option","type":"uint256"},{"name":"_v","type":"uint8"},{"name":"_r","type":"bytes32"},{"name":"_s","type":"bytes32"}],"name":"vote","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"STATEMENT","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"who","type":"address"},{"indexed":true,"name":"option","type":"uint256"}],"name":"Voted","type":"event"}];
const CounterCodeHash = '0xbd14a8001440940649ecfbd1e064132ebeff4487b8f9c57bea485a90067b1aee';
const Options = ['Red', 'Green', 'Blue'];

class VoteOption extends ReactiveComponent {
	constructor () {
		super(['votes', 'enabled', 'already']);
	}
	readyRender () {
		console.log(`already: ${JSON.stringify(this.state.already)}`)
		var s = {float: 'left', minWidth: '3em'};
		if (!this.state.enabled)
			s.cursor = 'not-allowed';
		return (<span style={{ color: '#888', borderLeft:
			`${1 + +this.state.votes * 10}px #444 solid` }}>
			<a
				style={s}
				href='#'
				onClick={this.state.enabled && this.props.vote}>
				{this.props.label}
			</a>
			{this.state.already.map(a => (<AccountIcon
				style={{width: '1.2em', verticalAlign: 'bottom', marginLeft: '1ex'}}
				key={a}
				address={a}
			/>))}
		</span>);
	}
}

class Counter extends React.Component {
	constructor() {
		super();
		this.state = { tx: null };
		this.vote = this.vote.bind(this);
	}
	componentWillMount () { this.componentWillReceiveProps(this.props); }
	componentWillReceiveProps (props) {
		this.voted = this.props.contract.hasVoted(parity.bonds.me);
		this.prevVote = this.props.contract.Voted({ who: parity.bonds.me });
		this.prevVotes = this.props.contract.Voted({ who: parity.bonds.accounts });
	}
	vote (option) {
		let message = this.props.contract.STATEMENT().map(removeSigningPrefix);
		parity.bonds.sign(message).done(s => {
			if (s.signed) {
				this.setState({tx: this.props.contract.vote(option, ...s.signed)});
			}
		});
	}
	render () {
		var votingEnabled = Bond.all([this.voted, this.state.tx])
			.map(([v, t]) => !v && (!t || !!t.failed || !!t.confirmed));
		return (<div>
			{Options.map((n, i) => (<div key={i}><VoteOption
				label={n}
				enabled={votingEnabled}
				already={this.prevVotes.map(a => a.filter(x => x.option == i).map(x => x.who))}
				votes={this.props.contract.votes(i)}
				vote={() => this.vote(i)}
			/></div>))}
			<Rspan>
			{this.prevVote.map(v => v.length > 0 ? `Already voted for ${Options[v[0].option]}` : '')}
			</Rspan>
			<div style={{marginTop: '1em'}}>
				<TransactionProgressBadge value={this.state.tx}/>
			</div>
			<div style={{fontSize: 'small'}}>
				Using contract at {this.props.contract.address}.
			</div>
		</div>);
	}
}

export class App extends React.Component {
	constructor () {
		super();
		this.addr = new Bond;
		this.addr.then(v => {
			window.localStorage.counter = v;
			let counter = parity.bonds.makeContract(v, CounterABI);
			this.setState({ tx: null, counter });
		});
		this.state = { tx: null, counter: window.localStorage.counter
			? parity.bonds.makeContract(window.localStorage.counter, CounterABI)
			: null };
		this.deploy = this.deploy.bind(this);
	}
	deploy () {
		let tx = parity.bonds.deployContract(CounterCode, CounterABI);
		this.setState({tx});
		tx.done(s => {
			window.localStorage.counter = s.deployed.address;
			this.setState({ tx: null, counter: s.deployed });
		});
	}
	render () {
		return (<div>
			{!!this.state.counter
				? <Counter contract={this.state.counter} />
				: <div>
					<RRaisedButton label='Deploy' onClick={this.deploy}/>
					<span style={{margin: '2em'}}>OR</span>
					<TextBond bond={this.addr} validator={v => v.startsWith('0x') && v.length == 42 && parity.bonds.code(v).map(_ => parity.api.util.sha3(_) == CounterCodeHash)}/>
					<TransactionProgressBadge value={this.state.tx}/>
				</div>
			}
		</div>);
	}
}
