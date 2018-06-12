import React, { Component } from 'react'
import { getCfdInstance } from '../utils/ContractLoader'
import web3 from '../utils/web3'
import { assets } from '../utils/CfdUtils'
import { withStyles } from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import { TextValidator, ValidatorForm } from 'react-material-ui-form-validator';
import Button from '@material-ui/core/Button';

const styles = theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    width: 200,
  },
  menu: {
    width: 200,
  },
  textValidator: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    minWidth: '400px'
  },
  button: {
    marginTop: theme.spacing.unit,
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit
  }
});

class CfdMakeForm extends Component {
  constructor(props) {
    super(props)

    this.state = {
      makeMakerAddress: '',
      makeAsset: '',
      makePosition: '',
      makeAmountEther: '',
      makeEndBlock: ''
    }
  }

  componentWillMount() {
    // custom rule will have name 'isEthereumAddress'
    ValidatorForm.addValidationRule('isEthereumAddress', (address) => {
      return web3.utils.isAddress(address);
    });
  }

  async componentDidMount() {
    const cfdInstance = await getCfdInstance();
    const currentBlockNumber = await web3.eth.getBlockNumber();
    const accounts = await web3.eth.getAccounts();

    this.setState({
      web3: web3,
      currentBlockNumber: currentBlockNumber,
      cfdInstance: cfdInstance,
      accounts: accounts,
      makeMakerAddress: accounts[0],
      makeEndBlock: (currentBlockNumber + 40).toString() // Suggest Make end block to be current block plus 10 minutes of blocks (4 blocks per minute * 10 minutes)
    });
  }

  handleChange = name => event => {
    this.setState({
      [name]: event.target.value,
    });
  };

  onMakeCfd = async (event) => {
    event.preventDefault();

    this.setState({ message: 'Waiting for Make CFD Transaction to confirm...' });

    console.log('cfdInstance.makeCfd.estimateGas', await this.state.cfdInstance.makeCfd.estimateGas(
      this.state.makeMakerAddress,
      this.state.makeAsset,
      this.state.makePosition,
      this.state.makeEndBlock,
      { value: web3.utils.toWei(this.state.makeAmountEther, 'ether'), from: this.state.accounts[0] }
    ));

    await this.state.cfdInstance.makeCfd(
      this.state.makeMakerAddress,
      this.state.makeAsset,
      this.state.makePosition,
      this.state.makeEndBlock,
      { value: web3.utils.toWei(this.state.makeAmountEther, 'ether'), from: this.state.accounts[0] }
    );

    this.setState({
      message: '\'Make CFD\' Transaction successful!',
      makeAsset: '',
      makePosition: 0,
      makeAmountEther: '',
      makeEndBlock: ''
    });
  };

  render() {
    const { classes } = this.props;

    return (
      <ValidatorForm onSubmit={(e) => this.onMakeCfd(e)}>
        <TextValidator
          styles={styles.textValidator}
          label="Maker Ethereum Address"
          name="makerEthereumAddress"
          helperText="Please input makers Ethereum Address"
          value={this.state.makeMakerAddress}
          onChange={this.handleChange('makeMakerAddress')}
          validators={['isEthereumAddress']}
          errorMessages={['Not a valid Ethereum address']}
          fullWidth
        />
        <TextField
          id="select-makeAsset"
          select
          required
          label="Asset"
          className={classes.textField}
          value={this.state.makeAsset}
          onChange={this.handleChange('makeAsset')}
          SelectProps={{
            MenuProps: {
              className: classes.menu,
            },
          }}
          helperText="Please select maker asset"
          margin="normal"
        >
          {assets.map(asset => (
            <MenuItem key={asset.value} value={asset.value.toString()}>
              {asset.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          id="select-makePosition"
          select
          required
          label="Position"
          className={classes.textField}
          value={this.state.makePosition}
          onChange={this.handleChange('makePosition')}
          SelectProps={{
            MenuProps: {
              className: classes.menu,
            },
          }}
          helperText="Please select maker position"
          margin="normal"
        >
          {[{ value: "0", label: 'Long' }, { value: "1", label: 'Short' }].map(asset => (
            <MenuItem key={asset.value} value={asset.value}>
              {asset.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          id="input-makeAmountEther"
          required
          label="Ether Amount"
          className={classes.textField}
          value={this.state.makeAmountEther}
          onChange={this.handleChange('makeAmountEther')}
          helperText="Please input maker ether amount"
          margin="normal"
        />
        <TextField
          id="input-makeEndBlock"
          required
          label="End Block"
          className={classes.textField}
          value={this.state.makeEndBlock}
          onChange={this.handleChange('makeEndBlock')}
          helperText="Please select maker end block"
          margin="normal"
        />
        <Button type="submit" variant="contained" className={classes.button}>Make</Button>
      </ValidatorForm>
    );
  }
}

export default withStyles(styles)(CfdMakeForm);