import preact from "@preact/preset-vite";
import dotenv from 'dotenv';

import {resolve} from 'path';

dotenv.config()


export default {
  plugins: [preact()],

  root: 'src',
  publicDir: '../public',

  resolve: {

    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat'
    }
  },

  server: {
    host: process.env.NODE_ENV == 'development' ? '192.168.1.100' : undefined,
    port: 8080
  },

  build: {
    outDir: '../dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        'marketing': resolve(__dirname, 'src/marketing.html'),
      },
    }
  },
  
  target: 'esnext',
	
	define: {
		"import.meta.env.NODE_ENV": `"${process.env.NODE_ENV}"`,
		"import.meta.env.API_URL": `"${process.env.API_URL}"`,
		"import.meta.env.APP_URL": `"${process.env.APP_URL}"`,
		"import.meta.env.APP_URL_UNQUOTED": `${process.env.APP_URL}`,
		"import.meta.env.BASE_URL": `${process.env.BASE_URL}`,
		"import.meta.env.PUBLIC_APP_URL": `"${process.env.PUBLIC_APP_URL}"`,
		"import.meta.env.PUBLIC_APP_URL_UNQUOTED": `${process.env.PUBLIC_APP_URL}`,
		"import.meta.env.SOURCE_VERSION": `"${process.env.SOURCE_VERSION}"`,
		"import.meta.env.SENTRY_DSN": `"${process.env.SENTRY_DSN}"`,
		"import.meta.env.GOOGLE_CLIENT_ID": `"${process.env.GOOGLE_CLIENT_ID}"`,
		"import.meta.env.GOOGLE_CLIENT_SECRET": `"${process.env.GOOGLE_CLIENT_SECRET}"`,
		"import.meta.env.VAPID_PUBLIC_KEY": `"${process.env.VAPID_PUBLIC_KEY}"`,
    "import.meta.env.GOOGLE_TRACKING_CODE": `"${process.env.GOOGLE_TRACKING_CODE}"`,
    "import.meta.env.GOOGLE_MARKETING_TRACKING_CODE": `"${process.env.GOOGLE_MARKETING_TRACKING_CODE}"`,
		"import.meta.env.EMBEDLY_KEY": `"${process.env.EMBEDLY_KEY}"`
	}
}
