import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { AppBar, Toolbar, Typography, Container } from '@material-ui/core';
import useStyles from '../utils/styles';

export default function Layout({ children }) {
  const classes = useStyles();

  return (
    <div>
      <Head>
        <title>nextjs webrtc</title>
      </Head>
      <AppBar position="static" className={classes.navbar}>
        <Toolbar>
          <Link href="/">
            <a>
              <Typography className={classes.brand}><h1>NextJS webrtc</h1></Typography>
            </a>
          </Link>
        </Toolbar>
      </AppBar>
      <Container className={classes.main}>{children}</Container>
    </div>
  )
};
