import React, { Component } from 'react';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import Switch from '@material-ui/core/Switch';

/**
 * 
 */

class DaiAuthorizer extends Component {

  constructor(props) {
    super(props)

    this.state = {
      currentDaiAllowance: undefined,
      daiAllowed: false,
      updatingDaiAllowance: true,
      max256BitNumber: '115792089237316195423570985008687907853269984665640564039457584007913129639935'
    }
  }

  async componentDidMount() {
    if (this.props.daiInstance && this.props.accounts && this.props.cfdContractAddress) {
      this.getDaiAllowance();
    }
  }

  async componentDidUpdate(prevProps) {
    // If all nessesary props are set and either one of them changed, query Dai allowance
    if ( this.props.daiInstance && this.props.accounts && this.props.cfdContractAddress 
      && (this.props.daiInstance !== prevProps.daiInstance || this.props.accounts !== prevProps.accounts || this.props.cfdContractAddress !== prevProps.cfdContractAddress)
    ) {
      this.getDaiAllowance();
    }
  }

  async getDaiAllowance() {
    this.setState({ updatingDaiAllowance: true });

    // Get current Dai allowance
    const currentDaiAllowance = await this.props.daiInstance.allowance.call(this.props.accounts[0], this.props.cfdContractAddress)
    this.setState({
      currentDaiAllowance: currentDaiAllowance,
      daiAllowed: currentDaiAllowance > 0
    });
    this.props.onDaiAuthUpdated(currentDaiAllowance > 0)
    console.log('currentDaiAllowance', currentDaiAllowance.toNumber());

    this.setState({ updatingDaiAllowance: false });
  }

  async setDaiAllowance(amount) {
    this.setState({ updatingDaiAllowance: true });
    try {
      // const gascost = await this.props.daiInstance.approve.estimateGas(this.props.cfdContractAddress, amount, { from: this.props.accounts[0] })
      // console.log('gascost', gascost);
      await this.props.daiInstance.approve(this.props.cfdContractAddress, amount, { from: this.props.accounts[0] })
      this.setState({ daiAllowed: amount > 0 })
      this.props.onDaiAuthUpdated(amount > 0)
    } catch (e) {
      console.error(e)
    }
    this.setState({ updatingDaiAllowance: false });
  }

  handleChange = async (event) => {
    console.log('event.target.checked', event.target.checked);
    if (event.target.checked) {
      await this.setDaiAllowance(this.state.max256BitNumber);
    } else {
      await this.setDaiAllowance('0');
    }
  };

  render() {
    if (this.props.daiInstance && this.props.accounts && this.props.cfdContractAddress) {
      return (
        <div>
          <FormGroup row>
            <FormControlLabel
              control={
                <Switch
                  disabled={this.state.updatingDaiAllowance}
                  checked={this.state.daiAllowed}
                  onChange={this.handleChange}
                  value="daiAllowed"
                />
              }
              label="Dai Authorization"
            />
          </FormGroup>
        </div>
      );
    } else {
      return (
        <div></div>
      );
    }
  }
}

export default DaiAuthorizer