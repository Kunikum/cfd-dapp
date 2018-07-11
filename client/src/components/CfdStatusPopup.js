import React, { Component } from 'react'
import { withStyles } from '@material-ui/core/styles'
import Popover from '@material-ui/core/Popover'
import Icon from '@material-ui/core/Icon'
import ReactJson from 'react-json-view'

import '../css/oswald.css'
import '../css/open-sans.css'
import '../css/pure-min.css'
import '../App.css'

const styles = theme => ({
  typography: {
    margin: theme.spacing.unit
  }
});

class CfdStatusPopup extends Component {
  state = {
    anchorEl: null
  };

  handleClick = event => {
    this.setState({ 
      anchorEl: event.currentTarget
    });
  };

  handleClose = () => {
    this.setState({
      anchorEl: null
    });
  };

  render() {
    const { classes } = this.props;
    const { anchorEl } = this.state;

    return (
      <div>
        <Icon onClick={this.handleClick} className={classes.icon}>add_circle</Icon>
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
          <ReactJson src={this.props.cfd} />
        </Popover>
      </div>
    );
  }
}

export default withStyles(styles)(CfdStatusPopup);