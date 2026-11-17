import { useEffect, useRef, useState } from 'react';

const siteKey = document.querySelector('meta[name="hcaptcha-site-key"]')?.getAttribute('content')?.trim() || '';
const scriptId = 'afroma-hcaptcha-script';
let hcaptchaReady = false;

export function isCaptchaConfigured() {
  return siteKey.length > 0;
}

export default function CaptchaWidget({ onToken, resetKey }) {
  const containerRef = useRef(null);
  const widgetId = useRef(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!siteKey) return undefined;
    let active = true;

    function renderWidget() {
      if (!active || !containerRef.current || !window.hcaptcha || widgetId.current) return;
      try {
        widgetId.current = window.hcaptcha.render(containerRef.current, {
          sitekey: siteKey,
          callback: token => {
            if (active) onToken(token);
          },
          'expired-callback': () => {
            if (active) onToken('');
          },
          'error-callback': () => {
            if (active) {
              onToken('');
              setLoadError(true);
            }
          },
        });
      } catch {
        if (active) setLoadError(true);
      }
    }

    let script = document.getElementById(scriptId);
    const onLoad = () => {
      hcaptchaReady = true;
      renderWidget();
    };
    const onError = () => {
      if (active) setLoadError(true);
    };

    if (hcaptchaReady) {
      renderWidget();
    } else {
      window.afromaHcaptchaOnload = onLoad;
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://js.hcaptcha.com/1/api.js?onload=afromaHcaptchaOnload&render=explicit';
        script.async = true;
        script.defer = true;
      }
      script.addEventListener('error', onError);
      if (!script.isConnected) document.head.appendChild(script);
    }

    return () => {
      active = false;
      if (script) {
        script.removeEventListener('error', onError);
      }
      if (widgetId.current !== null && window.hcaptcha) {
        window.hcaptcha.reset(widgetId.current);
      }
      widgetId.current = null;
      onToken('');
    };
  }, [onToken]);

  useEffect(() => {
    if (widgetId.current !== null && window.hcaptcha) {
      onToken('');
      window.hcaptcha.reset(widgetId.current);
    }
  }, [resetKey, onToken]);

  if (!siteKey) return null;

  return (
    <div className="captcha-widget">
      <div ref={containerRef} />
      {loadError && (
        <p className="form-alert" role="alert">
          Não foi possível carregar a verificação antirobô. Tente recarregar a página.
        </p>
      )}
    </div>
  );
}
