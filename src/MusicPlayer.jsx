import React, { useEffect, useRef, useState } from 'react';
import { safeMediaUrl, safeYouTubeEmbedUrl } from './safeUrls.js';

let youtubeApiPromise;

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve, reject) => {
    const scriptId = 'afroma-youtube-iframe-api';
    let script = document.getElementById(scriptId);
    const previousCallback = window.onYouTubeIframeAPIReady;
    let settled = false;
    let timeoutId;

    function fail(error) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      script?.remove();
      youtubeApiPromise = undefined;
      reject(error);
    }

    function complete() {
      if (settled) return;
      if (!window.YT?.Player) {
        fail(new Error('O player do YouTube não respondeu.'));
        return;
      }
      settled = true;
      window.clearTimeout(timeoutId);
      resolve(window.YT);
    }

    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousCallback === 'function') previousCallback();
      complete();
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
    }

    script.addEventListener('load', complete, { once: true });
    script.addEventListener('error', () => {
      fail(new Error('Não foi possível carregar o player do YouTube.'));
    }, { once: true });
    timeoutId = window.setTimeout(() => {
      fail(new Error('O player do YouTube demorou demais para responder.'));
    }, 15000);

    if (!script.isConnected) document.head.appendChild(script);
  });

  return youtubeApiPromise;
}

export default function MusicPlayer({
  musica,
  musicaAnterior,
  proximaMusica,
  curtida,
  onCurtir,
  repeticao,
  setRepeticao
}) {
  const iframeRef = useRef(null);
  const playerRef = useRef(null);
  const nextTrackRef = useRef(proximaMusica);
  const repeatRef = useRef(repeticao);
  const [tocando, setTocando] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const [playerPronto, setPlayerPronto] = useState(false);
  const [erroPlayer, setErroPlayer] = useState('');

  useEffect(() => {
    nextTrackRef.current = proximaMusica;
    repeatRef.current = repeticao;
  }, [proximaMusica, repeticao]);

  useEffect(() => {
    let active = true;
    let playerInstance = null;
    let readyTimer;

    playerRef.current = null;
    setTocando(false);
    setTempo(0);
    setDuracao(0);
    setPlayerPronto(false);
    setErroPlayer('');

    if (!musica?.youtubeId) {
      setErroPlayer('Esta faixa ainda não possui um vídeo do YouTube conectado.');
      return () => {
        active = false;
      };
    }

    loadYouTubeApi()
      .then(YT => {
        if (!active || !iframeRef.current) return;

        readyTimer = window.setTimeout(() => {
          if (active) setErroPlayer('O vídeo não respondeu. Verifique se o link continua disponível.');
        }, 10000);

        playerInstance = new YT.Player(iframeRef.current, {
          events: {
            onReady: event => {
              if (!active) return;
              window.clearTimeout(readyTimer);
              playerRef.current = event.target;
              setPlayerPronto(true);
              setDuracao(event.target.getDuration() || 0);
            },
            onStateChange: event => {
              if (!active) return;
              const { PlayerState } = window.YT;
              setTocando(event.data === PlayerState.PLAYING);
              setDuracao(event.target.getDuration() || 0);

              if (event.data === PlayerState.ENDED) {
                if (repeatRef.current) {
                  event.target.seekTo(0, true);
                  event.target.playVideo();
                } else {
                  nextTrackRef.current?.();
                }
              }
            },
            onError: () => {
              if (!active) return;
              window.clearTimeout(readyTimer);
              setPlayerPronto(false);
              setErroPlayer('Não foi possível reproduzir esta faixa. Verifique o vídeo do YouTube.');
            }
          }
        });
        playerRef.current = playerInstance;
      })
      .catch(error => {
        window.clearTimeout(readyTimer);
        if (active) setErroPlayer(error.message || 'O player do YouTube não está disponível.');
      });

    return () => {
      active = false;
      window.clearTimeout(readyTimer);
      if (playerInstance && typeof playerInstance.destroy === 'function') {
        playerInstance.destroy();
      }
      if (playerRef.current === playerInstance) playerRef.current = null;
    };
  }, [musica?.id, musica?.youtubeId]);

  useEffect(() => {
    if (!tocando) return undefined;

    const timerId = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;

      try {
        const currentTime = player.getCurrentTime();
        const currentDuration = player.getDuration();
        if (Number.isFinite(currentTime)) setTempo(currentTime);
        if (Number.isFinite(currentDuration) && currentDuration > 0) setDuracao(currentDuration);
      } catch {
        setTocando(false);
      }
    }, 500);

    return () => window.clearInterval(timerId);
  }, [tocando, musica?.id]);

  if (!musica) return null;

  function playPause() {
    const player = playerRef.current;
    if (!playerPronto || !player) {
      setErroPlayer('O player ainda está carregando. Tente novamente em instantes.');
      return;
    }

    setErroPlayer('');
    if (tocando) player.pauseVideo();
    else player.playVideo();
  }

  function seek(event) {
    const nextTime = Number(event.target.value);
    setTempo(nextTime);
    playerRef.current?.seekTo(nextTime, true);
  }

  function formatarTempo(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
  }

  return (
    <div className="music-player">
      <div className="player-main">
        <img src={safeMediaUrl(musica.imagem)} alt="" className="player-cover" />
        <div className="player-info">
          <strong>{musica.titulo}</strong>
          <span>{musica.artista}</span>
          <small>{musica.genero}</small>
        </div>
        <button
          className={curtida ? 'player-heart liked' : 'player-heart'}
          onClick={onCurtir}
          aria-label="Curtir música"
        >
          {curtida ? '♥' : '♡'}
        </button>
      </div>

      <div className="player-center">
        <div className="player-controls">
          <button onClick={musicaAnterior} aria-label="Música anterior">⏮</button>
          <button
            className="play-button"
            onClick={playPause}
            aria-label={tocando ? 'Pausar' : 'Reproduzir'}
          >
            {tocando ? 'Ⅱ' : '▶'}
          </button>
          <button onClick={proximaMusica} aria-label="Próxima música">⏭</button>
          <button
            className={repeticao ? 'repeat active' : 'repeat'}
            onClick={() => setRepeticao(!repeticao)}
            aria-label="Repetir música"
            aria-pressed={repeticao}
          >
            🔁
          </button>
        </div>

        <div className="progress-area">
          <span>{formatarTempo(tempo)}</span>
          <input
            type="range"
            min="0"
            max={duracao || 100}
            step="1"
            value={Math.min(tempo, duracao || 100)}
            onChange={seek}
            disabled={!playerPronto || !duracao}
            aria-label="Posição da música"
          />
          <span>{duracao ? formatarTempo(duracao) : musica.duracao}</span>
        </div>
        {erroPlayer && <small className="player-error" role="status">{erroPlayer}</small>}
      </div>

      <iframe
        key={musica.id}
        ref={iframeRef}
        className="youtube-hidden"
        src={safeYouTubeEmbedUrl(musica.youtubeId, window.location.origin)}
        title={`Player ${musica.titulo}`}
        allow="autoplay; encrypted-media"
      />
    </div>
  );
}
