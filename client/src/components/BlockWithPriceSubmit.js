import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Popover from '@material-ui/core/Popover';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Icon from '@material-ui/core/Icon';
import AddIcon from '@material-ui/icons/Add';
import TextField from '@material-ui/core/TextField';
import { Typography } from '@material-ui/core';
import web3 from '../utils/web3';
import { assetIdToString } from '../utils/CfdUtils';

const styles = theme => ({
  button: {
    margin: theme.spacing.unit,
  },
});

class BlockWithPriceSubmit extends Component {
  constructor(props) {
    super(props);

    this.state = {
      anchorEl: null,
      apoInstance: props.apoInstance,
      priceRecords: props.priceRecords,
      currentAccount: props.currentAccount,
      assetId: props.assetId,
      blockNo: props.blockNo,
      inputPrice: '',
      blockPrice: '',
    };
  }

  async componentDidMount() {
    // Set inputPrice and blockPrice to the newest price of the assetId+blockNo-combination prices.
    if (this.state.priceRecords) {
      // eslint-disable-next-line max-len
      const priceRecords = this.state.priceRecords.filter(record => record.assetId.toNumber() === this.state.assetId && record.blockNumber.toNumber() === this.state.blockNo);
      if (priceRecords && priceRecords.length) {
        // eslint-disable-next-line max-len
        const newestPriceRecord = priceRecords.reduce((prev, current) => ((prev.transactionBlockNumber > current.transactionBlockNumber) ? prev : current));
        this.setState({
          inputPrice: newestPriceRecord.price.toString(),
          blockPrice: newestPriceRecord.price.toString(),
        });
      }
    }
  }

  handleClick = (event) => {
    const currentTarget = event.currentTarget;
    this.setState(prevState => ({
      anchorEl: currentTarget,
      inputPrice: prevState.blockPrice,
    }));
  };

  handleClose = () => {
    this.setState(prevState => ({
      anchorEl: null,
      inputPrice: prevState.blockPrice,
    }));
  };

  registerPrice = async (event) => {
    event.preventDefault();

    this.setState({ message: 'Waiting for Register Price Transaction to confirm...' });

    await this.state.apoInstance.recordAssetPrice(
      this.state.assetId,
      this.state.blockNo,
      web3.utils.toWei(this.state.inputPrice, 'ether'),
      { from: this.state.currentAccount },
    );

    this.setState({
      message: '\'Register Price\' Transaction successful!',
    });
  };

  render() {
    const anchorEl = this.state.anchorEl;
    const classes = this.props.classes;

    return (
      <div>
        {this.state.blockNo}
        <IconButton color="default" onClick={event => this.handleClick(event)} className={classes.iconButton}>
          {this.state.inputPrice ? (
            <Icon className={classes.icon} color="secondary">
              edit_icon
            </Icon>
          ) : (<AddIcon className={classes.icon} color="primary" />)}
        </IconButton>
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
            horizontal: 'right',
          }}
        >
          <Typography>
            Asset:
            {assetIdToString(this.state.assetId)}
            {' '}
            BlockNo:
            {this.state.blockNo}
          </Typography>
          <form onSubmit={this.registerPrice}>
            <TextField
              className={classes.textField}
              label="Price"
              name="price"
              type="number"
              value={this.state.inputPrice}
              onChange={event => this.setState({ inputPrice: event.target.value })}
              helperText="Please input price"
            />
            <Button type="submit" variant="contained" className={classes.button}>
              Register Price
            </Button>
          </form>
        </Popover>
      </div>
    );
  }
}

BlockWithPriceSubmit.propTypes = {
  apoInstance: PropTypes.shape({
    recordAssetPrice: PropTypes.func,
  }).isRequired,
  priceRecords: PropTypes.arrayOf(PropTypes.shape({
    assetId: PropTypes.object,
    blockNumber: PropTypes.object,
    price: PropTypes.string,
    transactionBlockNumber: PropTypes.number,
  })),
  currentAccount: PropTypes.string.isRequired,
  assetId: PropTypes.number.isRequired,
  blockNo: PropTypes.number.isRequired,
  classes: PropTypes.object, /* eslint-disable-line react/forbid-prop-types */
};

BlockWithPriceSubmit.defaultProps = {
  classes: {},
  priceRecords: [],
};

export default withStyles(styles)(BlockWithPriceSubmit);
