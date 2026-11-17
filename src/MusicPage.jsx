import React, { useEffect, useMemo, useState } from "react";
import { musicas as musicasIniciais } from "./musicData.js";
import MusicPlayer from "./MusicPlayer.jsx";
import { safeMediaUrl } from "./safeUrls.js";

export default function MusicPage({
  musicasDisponiveis = musicasIniciais,
  usuario,
  favoritos,
  onToggleFavorite,
  onRequireLogin
}) {

  const listaMusicas = musicasDisponiveis;
  const curtidas = favoritos || [];
  const [musicaAtual, setMusicaAtual] =
    useState(listaMusicas[0] || null);

  const [playlist, setPlaylist] =
    useState([]);

  const [pesquisa, setPesquisa] =
    useState("");

  const [repeticao, setRepeticao] =
    useState(false);

  const [aba, setAba] =
    useState("todas");

  useEffect(() => {
    setMusicaAtual(atual =>
      listaMusicas.find(musica => musica.id === atual?.id) || listaMusicas[0] || null
    );
    setPlaylist(lista => lista.filter(item => listaMusicas.some(musica => musica.id === item.id)));
  }, [listaMusicas]);

  const musicasFiltradas =
    useMemo(() => {

      return listaMusicas.filter(musica => {

        const texto =
          `${musica.titulo} ${musica.artista} ${musica.genero}`
            .toLowerCase();

        return texto.includes(
          pesquisa.toLowerCase()
        );

      });

    }, [pesquisa, listaMusicas]);


  function tocar(musica) {
    setMusicaAtual(musica);
  }


  function curtir(id) {
    if (!usuario) {
      onRequireLogin?.();
      return;
    }
    onToggleFavorite?.(id);
  }


  function adicionarPlaylist(musica) {

    setPlaylist(lista => {

      if (
        lista.some(
          item =>
            item.id === musica.id
        )
      ) {
        return lista;
      }

      return [
        ...lista,
        musica
      ];

    });

  }


  function removerPlaylist(id) {

    setPlaylist(
      lista =>
        lista.filter(
          musica =>
            musica.id !== id
        )
    );

  }


  function proximaMusica() {
    if (!listaMusicas.length || !musicaAtual) return;

    const indice =
      listaMusicas.findIndex(
        musica =>
          musica.id === musicaAtual.id
      );

    let proximo =
      indice + 1;

    if (
      proximo >=
      listaMusicas.length
    ) {

      if (repeticao) {
        proximo = 0;
      } else {
        return;
      }

    }

    setMusicaAtual(
      listaMusicas[proximo]
    );

  }


  function musicaAnterior() {
    if (!listaMusicas.length || !musicaAtual) return;

    const indice =
      listaMusicas.findIndex(
        musica =>
          musica.id === musicaAtual.id
      );

    let anterior =
      indice - 1;

    if (anterior < 0) {
      anterior =
        listaMusicas.length - 1;
    }

    setMusicaAtual(
      listaMusicas[anterior]
    );

  }


  const listaExibida =
    aba === "curtidas"
      ? listaMusicas.filter(
          musica =>
            curtidas.includes(
              musica.id
            )
        )
      : aba === "playlist"
        ? playlist
        : musicasFiltradas;


  return (

    <section className="music-page">

      <div className="music-heading">

        <div>

          <span className="eyebrow">
            AFROMA MUSIC
          </span>

          <h1 className="page-title">
            Música
          </h1>

          <p className="music-description">
            Escute artistas e sons que
            fazem parte da cultura
            afro-brasileira, com destaque
            para o Maranhão.
          </p>

        </div>

      </div>


      <div className="music-search">

        <span>
          🔎
        </span>

        <input
          aria-label="Pesquisar música, artista ou gênero"
          value={pesquisa}
          onChange={e =>
            setPesquisa(
              e.target.value
            )
          }
          placeholder="Pesquisar música, cantor ou gênero..."
        />

      </div>


      <div className="music-tabs">

        <button
          className={
            aba === "todas"
              ? "active"
              : ""
          }
          onClick={() =>
            setAba("todas")
          }
        >
          Todas
        </button>

        <button
          className={
            aba === "curtidas"
              ? "active"
              : ""
          }
          onClick={() =>
            setAba("curtidas")
          }
        >
          ♥ Curtidas
          <span>
            {curtidas.length}
          </span>
        </button>

        <button
          className={
            aba === "playlist"
              ? "active"
              : ""
          }
          onClick={() =>
            setAba("playlist")
          }
        >
          ☷ Minha playlist
          <span>
            {playlist.length}
          </span>
        </button>

      </div>


      <div className="music-grid">

        {listaExibida.map(
          musica => (

            <article
              className={
                musicaAtual?.id ===
                musica.id
                  ? "music-card playing"
                  : "music-card"
              }
              key={musica.id}
            >

              <div className="music-cover">

                <img
                  src={safeMediaUrl(musica.imagem)}
                  alt={`Capa de ${musica.titulo}, artista ${musica.artista}`}
                />

                <button
                  className="music-play-overlay"
                  onClick={() =>
                    tocar(musica)
                  }
                  aria-label={`Selecionar música ${musica.titulo}`}
                >

                  {musicaAtual?.id ===
                    musica.id
                    ? "Ⅱ"
                    : "▶"}

                </button>

              </div>


              <div className="music-card-body">

                <div className="music-meta">

                  <span>
                    {musica.genero}
                  </span>

                  <span>
                    {musica.ano}
                  </span>

                </div>


                <h2>
                  {musica.titulo}
                </h2>

                <h3>
                  {musica.artista}
                </h3>

                <p>
                  {musica.regiao}
                </p>


                <div className="music-actions">

                  <button
                    className={
                      curtidas.includes(
                        musica.id
                      )
                        ? "liked"
                        : ""
                    }
                    onClick={() =>
                      curtir(
                        musica.id
                      )
                    }
                    aria-label={curtidas.includes(musica.id) ? `Remover ${musica.titulo} dos favoritos` : `Favoritar ${musica.titulo}`}
                    aria-pressed={curtidas.includes(musica.id)}
                  >
                    {curtidas.includes(
                      musica.id
                    )
                      ? "♥"
                      : "♡"}
                  </button>


                  <button
                    onClick={() =>
                      adicionarPlaylist(
                        musica
                      )
                    }
                    aria-label={`Adicionar ${musica.titulo} à playlist`}
                  >
                    + Playlist
                  </button>

                </div>

              </div>

            </article>

          )
        )}

      </div>


      {aba === "playlist" &&
        playlist.length > 0 && (

          <div className="playlist-box">

            <h2>
              Minha playlist
            </h2>

            {playlist.map(
              musica => (

                <div
                  className="playlist-item"
                  key={musica.id}
                >

                  <img
                    src={safeMediaUrl(musica.imagem)}
                    alt=""
                  />

                  <div>

                    <strong>
                      {musica.titulo}
                    </strong>

                    <span>
                      {musica.artista}
                    </span>

                  </div>

                  <button
                    onClick={() =>
                      tocar(musica)
                    }
                  >
                    ▶
                  </button>

                  <button
                    onClick={() =>
                      removerPlaylist(
                        musica.id
                      )
                    }
                  >
                    ×
                  </button>

                </div>

              )
            )}

          </div>

        )}


      {listaExibida.length === 0 && (

        <div className="empty">

          <span>
            🎵
          </span>

          <h2>
            Nenhuma música encontrada
          </h2>

          <p>
            Tente pesquisar outro artista
            ou título.
          </p>

        </div>

      )}


      <MusicPlayer
        musica={musicaAtual}
        musicaAnterior={
          musicaAnterior
        }
        proximaMusica={
          proximaMusica
        }
        curtida={Boolean(musicaAtual && curtidas.includes(musicaAtual.id))}
        onCurtir={() =>
          musicaAtual && curtir(musicaAtual.id)
        }
        repeticao={repeticao}
        setRepeticao={
          setRepeticao
        }
      />

    </section>

  );
}