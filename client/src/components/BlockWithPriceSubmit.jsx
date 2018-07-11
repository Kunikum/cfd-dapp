import React, { Component } from 'react'
import { assetIdToString } from '../utils/CfdUtils'
import { withStyles } from '@material-ui/core/styles'
import Popover from '@material-ui/core/Popover'
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Icon from '@material-ui/core/Icon';
import AddIcon from '@material-ui/icons/Add';
import TextField from '@material-ui/core/TextField';
import web3 from '../utils/web3'
import { Typography } from '@material-ui/core';

const styles = theme => ({
  button: {
    margin: theme.spacing.unit,
  }
});

class BlockWithPriceSubmit extends Component {
  constructor(props) {
    super(props)

    this.state = {
      anchorEl: null,
      web3: web3,
      apoInstance: props.apoInstance,
      priceRecords: props.priceRecords,
      currentAccount: props.currentAccount,
      assetId: props.assetId,
      blockNo: props.blockNo,
      inputPrice: '',
      blockPrice: ''
    }
  }

  async componentDidMount() {

    // Set inputPrice and blockPrice to the newest price of the assetId+blockNo-combination prices.
    if (this.state.priceRecords) {
      const priceRecords = this.state.priceRecords.filter((record) => { 
        return record.assetId.toNumber() === this.state.assetId && record.blockNumber.toNumber() === this.state.blockNo;
      })
      if (priceRecords && priceRecords.length) {
        const newestPriceRecord = priceRecords.reduce((prev, current) => (prev.transactionBlockNumber > current.transactionBlockNumber) ? prev : current)
        this.setState({
          inputPrice: newestPriceRecord.price.toString(),
          blockPrice: newestPriceRecord.price.toString()
        })
      }
    }
  }

  handleClick = event => {
    this.setState({
      anchorEl: event.currentTarget,
      inputPrice: this.state.blockPrice
    });
  };

  handleClose = () => {
    this.setState({
      anchorEl: null,
      inputPrice: this.state.blockPrice
    });
  };

  registerPrice = async (event) => {
    event.preventDefault();

    this.setState({ message: 'Waiting for Register Price Transaction to confirm...' });

    await this.state.apoInstance.recordAssetPrice(
      this.state.assetId,
      this.state.blockNo,
      web3.utils.toWei(this.state.inputPrice, 'ether'),
      { from: this.state.currentAccount }
    );

    this.setState({
      message: '\'Register Price\' Transaction successful!'
    });
  };

  render() {
    const { anchorEl } = this.state;
    const { classes } = this.props;

    return (
      <div>
        {this.state.blockNo}
        <IconButton color="default" onClick={this.handleClick} className={classes.iconButton}>
          {this.state.inputPrice ? (
            <Icon className={classes.icon} color="secondary">edit_icon</Icon>
          ) : (
              <AddIcon className={classes.icon} color="primary" />
            )}
        </IconButton>
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
          <Typography>Asset: {assetIdToString(this.state.assetId)} BlockNo: {this.state.blockNo}</Typography>
          <form onSubmit={this.registerPrice}>
            <TextField
              className={classes.textField}
              label="Price"
              name="price"
              value={this.state.inputPrice}
              onChange={event => this.setState({ inputPrice: event.target.value })}
              helperText="Please input price"
            />
            <Button type="submit" variant="contained" className={classes.button}>Register Price</Button>
          </form>
        </Popover>
      </div>
    );
  }
}

export default withStyles(styles)(BlockWithPriceSubmit);