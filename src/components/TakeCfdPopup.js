import React, { Component } from 'react'
import { withStyles } from '@material-ui/core/styles'
import Popover from '@material-ui/core/Popover'
import Button from '@material-ui/core/Button';
import { TextValidator, ValidatorForm } from 'react-material-ui-form-validator';
import web3 from '../utils/web3'

import '../css/oswald.css'
import '../css/open-sans.css'
import '../css/pure-min.css'
import '../App.css'

const styles = theme => ({
  div: {
    margin: theme.spacing.unit
  },
  button: {
    margin: theme.spacing.unit,
  }
});

const textInputStyle = {
  minWidth: '400px'
}

class TakeCfdPopup extends Component {
  constructor(props) {
    super(props)

    this.state = {
      anchorEl: null,
      cfdId: props.cfdId,
      takerAddress: ''
    }
  }

  componentWillMount() {
    // custom rule will have name 'isEthereumAddress'
    ValidatorForm.addValidationRule('isEthereumAddress', (address) => {
      return web3.utils.isAddress(address);
    });
  }

  handleClick = event => {
    this.setState({
      anchorEl: event.currentTarget
    });
  };

  handleClose = () => {
    this.setState({
      anchorEl: null,
      takerAddress: ''
    });
  };

  render() {
    const { anchorEl } = this.state;
    const { classes } = this.props;

    return (
      <div>
        <button onClick={this.handleClick} className="pure-button" disabled={this.props.disabled}>Take</button>
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={this.handleClose}
          anchorOrigin={{
            vertical: "top",
            horizontal: "left"
          }}
          transformOrigin={{
            vertical: "bottom",
            horizontal: "left"
          }}
        >
          <ValidatorForm onSubmit={(e) => this.props.takeCfdHandler(this.state.cfdId, this.state.takerAddress, e)}>
            <TextValidator
              style={textInputStyle}
              label="Taker Ethereum Address"
              name="takerEthereumAddress"
              value={this.state.takerAddress}
              onChange={event => this.setState({ takerAddress: event.target.value })}
              validators={['isEthereumAddress']}
              errorMessages={['Not a valid Ethereum address']}

            />
            <Button type="submit" variant="contained" className={classes.button}>Take</Button>
          </ValidatorForm>
        </Popover>
      </div>
    );
  }
}

export default withStyles(styles)(TakeCfdPopup);