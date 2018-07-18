import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Popover from '@material-ui/core/Popover';
import Button from '@material-ui/core/Button';
import { TextValidator, ValidatorForm } from 'react-material-ui-form-validator';
import web3 from '../utils/web3';

import '../css/oswald.css';
import '../css/open-sans.css';
import '../css/pure-min.css';
import '../App.css';

const styles = theme => ({
  div: {
    margin: theme.spacing.unit,
  },
  button: {
    margin: theme.spacing.unit,
  },
});

const textInputStyle = {
  minWidth: '400px',
};

class TakeCfdPopup extends Component {
  constructor(props) {
    super(props);

    this.state = {
      anchorEl: null,
      cfdId: props.cfdId,
      takerAddress: props.takerAddress,
    };
  }

  componentWillMount() {
    // custom rule will have name 'isEthereumAddress'
    ValidatorForm.addValidationRule('isEthereumAddress', address => web3.utils.isAddress(address));
  }

  handleClick = (event) => {
    this.setState({
      anchorEl: event.currentTarget,
    });
  };

  handleClose = () => {
    this.setState({
      anchorEl: null,
      takerAddress: this.props.takerAddress,
    });
  };

  render() {
    const anchorEl = this.state.anchorEl;
    const classes = this.props.classes;

    return (
      <div>
        <button onClick={this.handleClick} type="submit" className="pure-button" disabled={this.props.disabled}>
          Take
        </button>
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={this.handleClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
        >
          <ValidatorForm onSubmit={e => this.props.takeCfdHandler(this.state.cfdId, this.state.takerAddress, e)}>
            <TextValidator
              style={textInputStyle}
              label="Taker Ethereum Address"
              name="takerEthereumAddress"
              value={this.state.takerAddress}
              onChange={event => this.setState({ takerAddress: event.target.value })}
              validators={['isEthereumAddress']}
              errorMessages={['Not a valid Ethereum address']}
              helperText="Please input makers Ethereum Address"
            />
            <Button type="submit" variant="contained" className={classes.button}>
              Take
            </Button>
          </ValidatorForm>
        </Popover>
      </div>
    );
  }
}

TakeCfdPopup.propTypes = {
  cfdId: PropTypes.number.isRequired,
  takerAddress: PropTypes.string.isRequired,
  classes: PropTypes.object, /* eslint-disable-line react/forbid-prop-types */
  disabled: PropTypes.bool,
  takeCfdHandler: PropTypes.func.isRequired,
};

TakeCfdPopup.defaultProps = {
  classes: {},
  disabled: false,
};

export default withStyles(styles)(TakeCfdPopup);
