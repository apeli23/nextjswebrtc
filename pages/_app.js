import {useEffect} from 'react';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
//  stop material-ui from rendering on server side
  useEffect(() => {
    const jssStyles = document.querySelector('#jss-server-side');
    if(jssStyles){
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);
  return <Component {...pageProps} />
}

export default MyApp