import {useEffect} from 'react';
import '../styles/globals.css';

function SafeHydrate({ children }) {
  return (
    <div suppressHydrationWarning>
      {typeof window === 'undefined' ? null : children}
    </div>
  )
}

function MyApp({ Component, pageProps }) {
//  stop material-ui from rendering on server side
  useEffect(() => {
    const jssStyles = document.querySelector('#jss-server-side');
    if(jssStyles){
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);
  return <SafeHydrate><Component {...pageProps} /></SafeHydrate>
}

export default MyApp