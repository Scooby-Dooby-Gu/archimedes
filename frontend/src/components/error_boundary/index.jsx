import { loadScript, useErrorBoundary } from '/lib/hooks/index.jsx';

function ErrorBoundary({children}) {
  var shouldRedirect = !(import.meta.env.NODE_ENV === 'development' || import.meta.env.NODE_ENV === 'qa')
  const [error, resetError] = useErrorBoundary(
    newError => {
      if (location.pathname.indexOf('crash') == -1 && !error) {
        Sentry.withScope((scope) => {
          //scope.setExtras(errorInfo);
          const eventId = Sentry.captureException(newError);
          if (shouldRedirect) {
            setTimeout(() => {
              if (location.pathname.indexOf('crash') == -1) {
                track('send', 'event', 'Exception', newError.message)
                route('/crash?origin=' + encodeURIComponent(location.pathname))
                resetError();
              }
            }, 100)
          }
        });
      }
    }
  );

  if (error && (error.status >= 400 || error.status < 500)) {
    if (error.status == 404) {
      return route('/not_found?message=' + encodeURIComponent(error.message))
    }
  }

  if (error && !shouldRedirect) {
    return [
      <h1 class="error">{error.toString()}</h1>,
        
      <ul>{((error.stack || '').split(/\n/g)).map((line) => <li>
        <div dangerouslySetInnerHTML={{
          __html: line.replace(/file:\/\/[^)]+/, (m) => `<a href="${m.replace('file', 'file')}">${m.split('ecosystem/')[1]}</a>`)
        }} />
      </li>)}</ul>
    ]
  } else {
    return children;
  }
  
}

export default ErrorBoundary