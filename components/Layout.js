import firebase from 'firebase/app';
import 'firebase/firestore';
import React, { useRef } from 'react';
import { Container } from '@material-ui/core';
import useStyles from '../utils/styles'

function Layout ({children}) {
  const classes = useStyles();
  return (
    <div>
      <Container className={classes.main}>{children}</Container>
    </div>
  );
};
export default Layout;

