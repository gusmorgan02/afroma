import React, { useEffect, useMemo, useRef, useState } from 'react';
import MusicPage from './MusicPage.jsx';
import { musicas as musicasIniciais } from './musicData.js';
import { getSupabaseError, supabase, supabaseConfigured } from './supabase.js';
import { safeMediaUrl } from './safeUrls.js';
import CaptchaWidget, { isCaptchaConfigured } from './CaptchaWidget.jsx';
import useAuthCooldown from './useAuthCooldown.js';
import './App.css';

function mapMusica(item) {
  return {
    id: item.id,
    titulo: item.title,
    artista: item.artist,
    genero: item.genre,
    regiao: item.region || '',
    ano: item.year || '',
    duracao: item.duration || '',
    imagem: item.image_url || '',
    youtubeId: item.youtube_id || '',
    descricao: item.description || '',
  };
}

const categorias = [
  {
    id: 'historia',
    nome: 'História',
    icone: '📚',
    descricao: 'Conheça histórias, memórias e patrimônios afro-brasileiros.',
  },
  {
    id: 'religioes',
    nome: 'Religiões de Matriz Africana',
    icone: '🪘',
    descricao: 'Conheça tradições, símbolos e manifestações religiosas.',
  },
  {
    id: 'culinaria',
    nome: 'Culinária',
    icone: '🍲',
    descricao: 'Sabores, receitas e tradições da culinária afro-maranhense.',
  },
  {
    id: 'musica',
    nome: 'Música',
    icone: '🎵',
    descricao: 'Artistas, músicas e gêneros afro-brasileiros.',
  },
  {
    id: 'danca',
    nome: 'Dança',
    icone: '💃🏿',
    descricao: 'Danças tradicionais e manifestações culturais.',
  },
  {
    id: 'personalidades',
    nome: 'Personalidades Negras',
    icone: '✊🏿',
    descricao: 'Conheça pessoas negras que marcaram nossa história.',
  },
];

const conteudosIniciais = [
  {
    id: 1,
    categoria: 'historia',
    titulo: 'A presença africana no Maranhão',
    resumo:
      'Conheça a influência dos povos africanos na formação cultural e social do Maranhão.',
    imagem:
      "https://agenciatambor.net.br/wp-content/uploads/2021/07/27710296_896756387165699_3613545419913289267_o.jpg" ,
  },
  {
    id: 2,
    categoria: 'musica',
    titulo: 'Reggae Maranhense',
    resumo:
      'Conheça a história do reggae no Maranhão e sua relação com São Luís.',
    imagem:
      "https://agenciatambor.net.br/wp-content/uploads/2023/08/WhatsApp-Image-2023-08-11-at-14.14.36.jpeg" ,
  },
  {
    id: 3,
    categoria: 'danca',
    titulo: 'Tambor de Crioula',
    resumo: 'Uma das manifestações culturais mais importantes do Maranhão.',
    imagem:
      "https://sme.goiania.go.gov.br/conexaoescola/wp-content/uploads/2024/06/18473073113_6a9ae705c6_b-e1719271381317.jpg" ,
  },
  {
    id: 4,
    categoria: 'culinaria',
    titulo: 'Sabores afro-maranhenses',
    resumo: 'Conheça pratos, ingredientes e tradições que atravessam gerações.',
    imagem:
      "https://s2.glbimg.com/OKEGGxvDNu9WQsjuEfV6WitDoJA=/620x465/s.glbimg.com/jo/g1/f/original/2016/04/02/rmculinaria2.jpg" ,
  },
  {
    id: 5,
    categoria: 'personalidades',
    titulo: 'Alcione',
    resumo:
      'Uma das maiores vozes da música brasileira e uma importante personalidade maranhense.',
    imagem:
    "https://f.i.uol.com.br/fotografia/2024/10/23/1729708338671941327d607_1729708338_1x1_md.jpg" ,
  },
  {
    id: 6,
    categoria: 'religioes',
    titulo: 'Tambor de Mina',
    resumo:
      'Conheça uma importante tradição religiosa de matriz africana presente no Maranhão.',
    imagem:
      "https://static.wixstatic.com/media/91c477_2816a9159a554d9cac21752f50773fc7~mv2.png/v1/fill/w_568,h_334,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/91c477_2816a9159a554d9cac21752f50773fc7~mv2.png" ,
  },
];

const eventosIniciais = [
  {
    id: 1,
    titulo: 'Festival de Cultura Afro-Maranhense',
    data: '05/12/2026',
    local: 'São Luís — MA',
    descricao:
      'Encontro com música, dança, culinária e manifestações da cultura afro-maranhense.',
  },
  {
    id: 2,
    titulo: 'Roda de Tambor de Crioula',
    data: '12/12/2026',
    local: 'Centro Histórico — São Luís',
    descricao:
      'Apresentação e celebração de uma das manifestações tradicionais do Maranhão.',
  },
  {
    id: 3,
    titulo: 'Encontro de Reggae Maranhense',
    data: '20/01/2027',
    local: 'São Luís — MA',
    descricao: 'Evento dedicado à história e à força do reggae maranhense.',
  },
];


export default function App() {
  const [tela, setTela] = useState('home');
  const [authUser, setAuthUser] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [dadosCarregando, setDadosCarregando] = useState(false);
  const [erroBackend, setErroBackend] = useState('');

  const [menuAberto, setMenuAberto] = useState(false);

  const [pesquisa, setPesquisa] = useState('');

  const [categoriaSelecionada, setCategoriaSelecionada] = useState('todos');

  const [conteudos, setConteudos] = useState(conteudosIniciais);
  const [eventos, setEventos] = useState(eventosIniciais);
  const [musicas, setMusicas] = useState(musicasIniciais);
  const [favoritos, setFavoritos] = useState([]);
  const [favoritosMusica, setFavoritosMusica] = useState([]);

  const [tamanhoFonte, setTamanhoFonte] = useState('normal');
  const [leitorTela, setLeitorTela] = useState(false);

  const [tema, setTema] = useState('claro');

  const [aviso, setAviso] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const authCooldown = useAuthCooldown();

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    const applySession = (session) => setAuthUser(session?.user || null);

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setErroBackend(getSupabaseError(error));
      if (active) applySession(data?.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) applySession(session);
      if (_event === 'PASSWORD_RECOVERY') setTela('redefinir-senha');
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;

    async function carregarDados() {
      setDadosCarregando(true);
      setErroBackend('');
      try {
        const [conteudosResult, eventosResult, musicasResult] = await Promise.all([
          supabase.from('cultural_contents').select('*').order('created_at', { ascending: false }),
          supabase.from('cultural_events').select('*').order('event_date'),
          supabase.from('cultural_music').select('*').order('created_at', { ascending: false }),
        ]);
        if (conteudosResult.error) throw conteudosResult.error;
        if (eventosResult.error) throw eventosResult.error;
        if (!active) return;
        setConteudos(conteudosResult.data.map(item => ({
          id: Number(item.id),
          categoria: item.category,
          titulo: item.title,
          resumo: item.summary,
          imagem: item.image_url || '',
          video: item.video_url || '',
        })));
        setEventos(eventosResult.data.map(item => ({
          id: Number(item.id),
          titulo: item.title,
          data: item.event_date,
          hora: item.event_time?.slice(0, 5) || '',
          local: item.location,
          descricao: item.description,
        })));
        if (musicasResult.error) {
          setErroBackend(`Não foi possível carregar músicas: ${getSupabaseError(musicasResult.error)}`);
        } else {
          setMusicas(musicasResult.data.map(mapMusica));
        }
      } catch (error) {
        if (active) setErroBackend(`Não foi possível carregar conteúdos e eventos: ${getSupabaseError(error)}`);
      } finally {
        if (active) setDadosCarregando(false);
      }
    }

    carregarDados();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!supabase || !authUser) {
      setUsuario(null);
      setFavoritos([]);
      setFavoritosMusica([]);
      return undefined;
    }
    let active = true;

    async function carregarPerfilEFavoritos() {
      try {
        const [profileResult, favoritesResult, musicFavoritesResult] = await Promise.all([
          supabase.from('profiles').select('name, role').eq('id', authUser.id).maybeSingle(),
          supabase.from('favorites').select('item_id').eq('user_id', authUser.id),
          supabase.from('music_favorites').select('track_id').eq('user_id', authUser.id),
        ]);
        if (profileResult.error) throw profileResult.error;
        if (favoritesResult.error) throw favoritesResult.error;
        if (musicFavoritesResult.error) throw musicFavoritesResult.error;
        if (!active) return;
        setUsuario({
          id: authUser.id,
          nome: profileResult.data?.name || authUser.user_metadata?.name || 'Usuário AFROMA',
          email: authUser.email,
          role: profileResult.data?.role || 'user',
        });
        setFavoritos(favoritesResult.data.map(item => item.item_id));
        setFavoritosMusica(musicFavoritesResult.data.map(item => item.track_id));
      } catch (error) {
        if (active) setErroBackend(`Não foi possível carregar o perfil: ${getSupabaseError(error)}`);
      }
    }

    carregarPerfilEFavoritos();
    return () => { active = false; };
  }, [authUser]);

  
  function navegar(destino) {
    setTela(destino);
    setMenuAberto(false);
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  
  async function alternarFavorito(id) {
    if (!usuario) {
      setAviso('Entre na sua conta para salvar conteúdos nos favoritos.');
      navegar('login');
      return;
    }
    const itemId = String(id);
    const jaFavoritado = favoritos.includes(itemId);
    try {
      const request = jaFavoritado
        ? supabase.from('favorites').delete().eq('user_id', usuario.id).eq('item_id', itemId)
        : supabase.from('favorites').insert({ user_id: usuario.id, item_id: itemId });
      const { error } = await request;
      if (error) throw error;
      setFavoritos((lista) => {
        if (jaFavoritado) {
          return lista.filter((item) => item !== itemId);
        }
        return [...lista, itemId];
      });
    } catch (error) {
      setErroBackend(`Não foi possível atualizar seus favoritos: ${getSupabaseError(error)}`);
    }
  }

  async function alternarFavoritoMusica(trackId) {
    if (!usuario) {
      setAviso('Entre na sua conta para salvar músicas nos favoritos.');
      navegar('login');
      return;
    }
    const jaFavoritada = favoritosMusica.includes(trackId);
    try {
      const request = jaFavoritada
        ? supabase.from('music_favorites').delete().eq('user_id', usuario.id).eq('track_id', trackId)
        : supabase.from('music_favorites').insert({ user_id: usuario.id, track_id: trackId });
      const { error } = await request;
      if (error) throw error;
      setFavoritosMusica(lista => jaFavoritada
        ? lista.filter(item => item !== trackId)
        : [...lista, trackId]);
    } catch (error) {
      setErroBackend(`Não foi possível atualizar seus favoritos de música: ${getSupabaseError(error)}`);
    }
  }

  async function realizarLogin(e) {
    e.preventDefault();
    if (!supabase) {
      setAviso('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para habilitar login.');
      return;
    }
    if (!prepararEnvioAuth()) return;
    const email = e.target.email.value.trim().toLowerCase();
    const senha = e.target.senha.value;
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
        options: captchaToken ? { captchaToken } : undefined,
      });
      if (error) {
        authCooldown.recordFailure();
        limparCaptcha();
        setAviso(getSupabaseError(error));
        return;
      }
      authCooldown.recordSuccess();
      limparCaptcha();
      setAviso('');
      navegar('home');
    } catch (error) {
      authCooldown.recordFailure();
      limparCaptcha();
      setAviso(getSupabaseError(error));
    }
  }

  async function realizarCadastro(e) {
    e.preventDefault();
    if (!supabase) {
      setAviso('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para habilitar cadastro.');
      return;
    }
    const nome = e.target.nome.value.trim();
    const email = e.target.email.value.trim().toLowerCase();
    const senha = e.target.senha.value;
    if (!nome || nome.length > 80) {
      setAviso('Informe um nome com até 80 caracteres.');
      return;
    }
    if (!prepararEnvioAuth()) return;
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { data: { name: nome }, ...(captchaToken ? { captchaToken } : {}) },
      });
      if (error) {
        authCooldown.recordFailure();
        limparCaptcha();
        setAviso(getSupabaseError(error));
        return;
      }
      authCooldown.recordSuccess();
      limparCaptcha();
      if (!data.session) {
        setAviso('Cadastro realizado. Confira seu e-mail para confirmar a conta e depois entre.');
        navegar('login');
        return;
      }
      setAviso('');
      navegar('home');
    } catch (error) {
      authCooldown.recordFailure();
      limparCaptcha();
      setAviso(getSupabaseError(error));
    }
  }

  async function recuperarSenha(e) {
    e.preventDefault();
    if (!supabase) {
      setAviso('Configure a conexão com Supabase para recuperar sua senha.');
      return;
    }
    if (!prepararEnvioAuth()) return;
    const email = e.target.email.value.trim().toLowerCase();
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
        ...(captchaToken ? { captchaToken } : {}),
      });
      if (error) {
        authCooldown.recordFailure();
        limparCaptcha();
        setAviso(getSupabaseError(error));
        return;
      }
      authCooldown.recordSuccess();
      limparCaptcha();
      setAviso('Se houver uma conta com este e-mail, enviaremos as instruções de recuperação.');
    } catch (error) {
      authCooldown.recordFailure();
      limparCaptcha();
      setAviso(getSupabaseError(error));
    }
  }

  function prepararEnvioAuth() {
    if (authCooldown.secondsRemaining > 0) {
      setAviso(`Aguarde ${authCooldown.secondsRemaining} segundo(s) antes de tentar novamente.`);
      return false;
    }
    if (import.meta.env.PROD && !isCaptchaConfigured()) {
      setAviso('A proteção antirobô não está configurada. O administrador precisa ativar o CAPTCHA antes de usar a autenticação.');
      return false;
    }
    if (isCaptchaConfigured() && !captchaToken) {
      setAviso('Conclua a verificação antirobô antes de continuar.');
      return false;
    }
    if (!authCooldown.beginAttempt()) {
      setAviso(authCooldown.pending
        ? 'Aguarde a solicitação atual terminar.'
        : 'Aguarde um instante antes de tentar novamente.');
      return false;
    }
    return true;
  }

  function limparCaptcha() {
    setCaptchaToken('');
    setCaptchaResetKey(key => key + 1);
  }

  async function atualizarSenha(e) {
    e.preventDefault();
    const senha = e.target.senha.value;
    const confirmacao = e.target.confirmacao.value;
    if (senha !== confirmacao) {
      setAviso('As senhas informadas não coincidem.');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) {
      setAviso(getSupabaseError(error));
      return;
    }
    setAviso('Senha atualizada com sucesso.');
    navegar('home');
  }

  async function excluirMinhaConta() {
    if (!usuario || !window.confirm('Excluir permanentemente sua conta, perfil e favoritos? Esta ação não pode ser desfeita.')) return;
    const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
    if (error) {
      setAviso(`Não foi possível excluir sua conta: ${getSupabaseError(error)}`);
      return;
    }
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
    if (signOutError) setErroBackend(`Conta excluída, mas não foi possível limpar a sessão local: ${getSupabaseError(signOutError)}`);
    setAuthUser(null);
    setUsuario(null);
    setFavoritos([]);
    setFavoritosMusica([]);
    setAviso('Sua conta e os dados associados foram excluídos.');
    navegar('home');
  }

  async function logout() {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) setErroBackend(`Não foi possível sair da conta: ${getSupabaseError(error)}`);
    }
    setAuthUser(null);
    setUsuario(null);
    setFavoritos([]);
    setFavoritosMusica([]);
    navegar('home');
  }

  async function salvarConteudo(conteudo, id) {
    const payload = {
      category: conteudo.categoria,
      title: conteudo.titulo,
      summary: conteudo.resumo,
      image_url: conteudo.imagem || null,
      video_url: conteudo.video || null,
    };
    const query = id
      ? supabase.from('cultural_contents').update(payload).eq('id', id).select().single()
      : supabase.from('cultural_contents').insert(payload).select().single();
    const { data, error } = await query;
    if (error) throw error;
    const salvo = {
      id: Number(data.id),
      categoria: data.category,
      titulo: data.title,
      resumo: data.summary,
      imagem: data.image_url || '',
      video: data.video_url || '',
    };
    setConteudos(lista => id
      ? lista.map(item => item.id === id ? salvo : item)
      : [salvo, ...lista]);
    return salvo;
  }

  async function removerConteudo(id) {
    const { error } = await supabase.from('cultural_contents').delete().eq('id', id);
    if (error) throw error;
    setConteudos(lista => lista.filter(item => item.id !== id));
  }

  async function salvarMusica(musica, id) {
    const payload = {
      title: musica.titulo.trim(),
      artist: musica.artista.trim(),
      genre: musica.genero.trim(),
      region: musica.regiao.trim(),
      year: musica.ano.trim(),
      duration: musica.duracao.trim(),
      image_url: musica.imagem.trim(),
      youtube_id: musica.youtubeId.trim(),
      description: musica.descricao.trim(),
    };
    const query = id
      ? supabase.from('cultural_music').update(payload).eq('id', id).select().single()
      : supabase.from('cultural_music').insert(payload).select().single();
    const { data, error } = await query;
    if (error) throw error;
    const salvo = mapMusica(data);
    setMusicas(lista => id
      ? lista.map(item => item.id === id ? salvo : item)
      : [salvo, ...lista]);
    return salvo;
  }

  async function removerMusica(id) {
    const { error } = await supabase.from('cultural_music').delete().eq('id', id);
    if (error) throw error;
    setMusicas(lista => lista.filter(item => item.id !== id));
  }

  async function salvarEvento(evento, id) {
    const payload = {
      title: evento.titulo,
      event_date: evento.data,
      event_time: evento.hora || null,
      location: evento.local,
      description: evento.descricao,
    };
    const query = id
      ? supabase.from('cultural_events').update(payload).eq('id', id).select().single()
      : supabase.from('cultural_events').insert(payload).select().single();
    const { data, error } = await query;
    if (error) throw error;
    const salvo = {
      id: Number(data.id),
      titulo: data.title,
      data: data.event_date,
      hora: data.event_time?.slice(0, 5) || '',
      local: data.location,
      descricao: data.description,
    };
    setEventos(lista => id
      ? lista.map(item => item.id === id ? salvo : item)
      : [...lista, salvo]);
    return salvo;
  }

  async function removerEvento(id) {
    const { error } = await supabase.from('cultural_events').delete().eq('id', id);
    if (error) throw error;
    setEventos(lista => lista.filter(item => item.id !== id));
  }

  async function enviarMidia(file) {
    const extensao = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const caminho = `${usuario.id}/${crypto.randomUUID()}.${extensao}`;
    const { error } = await supabase.storage.from('afroma-media').upload(caminho, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });
    if (error) throw error;
    return supabase.storage.from('afroma-media').getPublicUrl(caminho).data.publicUrl;
  }

  const resultadosBusca = useMemo(() => {
    const texto = pesquisa.trim().toLowerCase();

    let resultado = conteudos;

    if (categoriaSelecionada !== 'todos') {
      resultado = resultado.filter(
        (item) => item.categoria === categoriaSelecionada
      );
    }

    if (texto) {
      resultado = resultado.filter((item) => {
        return (
          item.titulo.toLowerCase().includes(texto) ||
          item.resumo.toLowerCase().includes(texto) || categorias.find((cat) => cat.id === item.categoria)?.nome.toLowerCase().includes(texto)
        );
      });
    }

    return resultado;
  }, [pesquisa, categoriaSelecionada, conteudos]);

  

  return (
    <div
      className={`app ${tema === 'escuro' ? 'dark-mode' : ''}`}
      style={{
        fontSize:
          tamanhoFonte === 'pequena'
            ? '90%'
            : tamanhoFonte === 'grande'
            ? '115%'
            : '100%',
      }}
    >
      <Header
        tela={tela}
        navegar={navegar}
        usuario={usuario}
        menuAberto={menuAberto}
        setMenuAberto={setMenuAberto}
      />

      {(!supabaseConfigured || erroBackend || dadosCarregando) && (
        <div className={`backend-status ${erroBackend ? 'error' : ''}`} role="status">
          {!supabaseConfigured
            ? ''
            : erroBackend || (dadosCarregando ? 'Carregando conteúdos e eventos…' : '')}
        </div>
      )}
      <main className="main-content" aria-live={leitorTela ? "polite" : "off"}>
        {}

        {tela === 'home' && (
          <Home
            navegar={navegar}
            pesquisa={pesquisa}
            setPesquisa={setPesquisa}
            setCategoriaSelecionada={setCategoriaSelecionada}
            conteudos={conteudos}
            favoritos={favoritos}
            alternarFavorito={alternarFavorito}
          />
        )}

        {}

        {tela === 'busca' && (
          <Busca
            pesquisa={pesquisa}
            setPesquisa={setPesquisa}
            categoriaSelecionada={categoriaSelecionada}
            setCategoriaSelecionada={setCategoriaSelecionada}
            resultados={resultadosBusca}
            favoritos={favoritos}
            alternarFavorito={alternarFavorito}
            navegar={navegar}
          />
        )}

        {/*MÚSICA*/}

        {tela === 'musica' && <MusicPage musicasDisponiveis={musicas} usuario={usuario} favoritos={favoritosMusica} onToggleFavorite={alternarFavoritoMusica} onRequireLogin={() => { setAviso('Entre na sua conta para favoritar músicas.'); navegar('login'); }} />}

        {/*FAVORITOS*/}

        {tela === 'favoritos' && (
          <Favoritos
            conteudos={conteudos}
            favoritos={favoritos}
            alternarFavorito={alternarFavorito}
            navegar={navegar}
          />
        )}

        {/*CALENDÁRIO*/}

        {tela === 'calendario' && <Calendario eventos={eventos} />}

        {/*PERFIL */}

        {tela === 'perfil' && (
          <Perfil
            usuario={usuario}
            navegar={navegar}
            tamanhoFonte={tamanhoFonte}
            setTamanhoFonte={setTamanhoFonte}
            leitorTela={leitorTela}
            setLeitorTela={setLeitorTela}
            tema={tema}
            setTema={setTema}
            logout={logout}
            excluirMinhaConta={excluirMinhaConta}
            aviso={aviso}
          />
        )}

        {/*LOGIN*/}

        {tela === 'login' && (
          <Login
            realizarLogin={realizarLogin}
            recuperarSenha={recuperarSenha}
            navegar={navegar}
            aviso={aviso}
            setCaptchaToken={setCaptchaToken}
            captchaResetKey={captchaResetKey}
            cooldownSeconds={authCooldown.secondsRemaining}
            authPending={authCooldown.pending}
          />
        )}

        {/*CADASTRO*/}

        {tela === 'cadastro' && (
          <Cadastro
            realizarCadastro={realizarCadastro}
            navegar={navegar}
            aviso={aviso}
            setCaptchaToken={setCaptchaToken}
            captchaResetKey={captchaResetKey}
            cooldownSeconds={authCooldown.secondsRemaining}
            authPending={authCooldown.pending}
          />
        )}

        {tela === 'redefinir-senha' && (
          <RedefinirSenha atualizarSenha={atualizarSenha} aviso={aviso} />
        )}

        {/*DETALHE*/}

        {tela.startsWith('detalhe-') && (
          <Detalhe
            id={Number(tela.replace('detalhe-', ''))}
            conteudos={conteudos}
            favoritos={favoritos}
            alternarFavorito={alternarFavorito}
            navegar={navegar}
          />
        )}

        {}

        {tela === 'admin' && (
          <Admin
            conteudos={conteudos}
            eventos={eventos}
            musicas={musicas}
            usuario={usuario}
            salvarConteudo={salvarConteudo}
            removerConteudo={removerConteudo}
            salvarMusica={salvarMusica}
            removerMusica={removerMusica}
            salvarEvento={salvarEvento}
            removerEvento={removerEvento}
            enviarMidia={enviarMidia}
            navegar={navegar}
          />
        )}
      </main>

      <BottomNavigation tela={tela} navegar={navegar} />
    </div>
  );
}

/*HEADER*/

function Header({ tela, navegar, usuario, menuAberto, setMenuAberto }) {
  return (
    <header className="top-header">
      <button className="brand" onClick={() => navegar('home')}>
        AFROMA
      </button>

      <nav className="desktop-nav">
        <button
          className={tela === 'home' ? 'active' : ''}
          onClick={() => navegar('home')}
        >
          Home
        </button>

        <button
          className={tela === 'busca' ? 'active' : ''}
          onClick={() => navegar('busca')}
        >
          Explorar
        </button>

        <button
          className={tela === 'musica' ? 'active' : ''}
          onClick={() => navegar('musica')}
        >
          Música
        </button>

        <button onClick={() => navegar('calendario')}>Eventos</button>
        {usuario?.role === 'admin' && <button onClick={() => navegar('admin')}>Admin</button>}
        {usuario ? (
          <button onClick={() => navegar('perfil')}>👤 {usuario.nome}</button>
        ) : (
          <button onClick={() => navegar('login')}>Entrar</button>
        )}
      </nav>

      <button
        className="mobile-menu-button"
        onClick={() => setMenuAberto(!menuAberto)}
        aria-label="Abrir menu"
      >
        ☰
      </button>

      {menuAberto && (
        <div className="mobile-menu">
          <button onClick={() => navegar('home')}>🏠 Home</button>

          <button onClick={() => navegar('busca')}>🔎 Explorar</button>

          <button onClick={() => navegar('musica')}>🎵 Música</button>

          <button onClick={() => navegar('favoritos')}>❤️ Favoritos</button>

          <button onClick={() => navegar('calendario')}>📅 Eventos</button>

          <button onClick={() => navegar('perfil')}>👤 Perfil</button>
          {usuario?.role === 'admin' && <button onClick={() => navegar('admin')}>⚙️ Administração</button>}
        </div>
      )}
    </header>
  );
}

/* HOME*/

function Home({
  navegar,
  pesquisa,
  setPesquisa,
  setCategoriaSelecionada,
  conteudos,
  favoritos,
  alternarFavorito,
}) {
  return (
    <div className="page">
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">CULTURA • MEMÓRIA • IDENTIDADE</span>

          <h1>
            A cultura afro-brasileira
            <br />
            vive aqui.
          </h1>

          <p>
            Descubra histórias, músicas, danças, sabores e personalidades que
            ajudam a construir a identidade do Brasil.
          </p>

          <div className="hero-buttons">
            <button className="primary-button" onClick={() => navegar('busca')}>
              Explorar cultura
            </button>

            <button
              className="secondary-button"
              onClick={() => navegar('musica')}
            >
              🎵 Ouvir músicas
            </button>
          </div>
        </div>

        <div className="hero-image">
          <img
            src="https://turismosaoluis.com.br/wp-content/uploads/2025/04/TAMBOR-DE-CRIOULA-2.jpg.webp" 
            alt="Manifestação cultural"
          />
        </div>
      </section>

      {/* PESQUISA */}

      <section className="search-section">
        <div className="search-box">
          <span>🔎</span>

          <input
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                navegar('busca');
              }
            }}
            placeholder="Pesquise por cultura, música, dança, história..."
            aria-label="Pesquisar conteúdo"
          />

          <button onClick={() => navegar('busca')}>Buscar</button>
        </div>
      </section>

      {/* CATEGORIAS */}

      <section className="section">
        <div className="section-header">
          <div>
            <span className="eyebrow">EXPLORE</span>

            <h2>Categorias</h2>
          </div>

          <button className="text-button" onClick={() => navegar('busca')}>
            Ver tudo →
          </button>
        </div>

        <div className="category-grid">
          {categorias.map((categoria) => (
            <button
              className="category-card"
              key={categoria.id}
              onClick={() => {
                if (categoria.id === 'musica') {
                  navegar('musica');
                  return;
                }
                setCategoriaSelecionada(categoria.id);
                navegar('busca');
              }}
            >
              <span className="category-icon">{categoria.icone}</span>

              <strong>{categoria.nome}</strong>

              <p>{categoria.descricao}</p>
            </button>
          ))}
        </div>
      </section>

      {/* DESTAQUES */}

      <section className="section">
        <div className="section-header">
          <div>
            <span className="eyebrow">EM DESTAQUE</span>

            <h2>Conheça nossa cultura</h2>
          </div>
        </div>

        <div className="content-grid">
          {conteudos.slice(0, 4).map((conteudo) => (
            <ContentCard
              key={conteudo.id}
              conteudo={conteudo}
              favorito={favoritos.includes(String(conteudo.id))}
              alternarFavorito={alternarFavorito}
              navegar={navegar}
            />
          ))}
        </div>
      </section>

      {/* MARANHÃO */}

      <section className="maranhao-banner">
        <div>
          <span className="eyebrow">DESTAQUE AFROMA</span>

          <h2>Maranhão: terra de ritmos, sabores e tradições</h2>

          <p>
            Conheça o Tambor de Crioula, o reggae maranhense, o Tambor de Mina,
            a culinária e tantas outras manifestações que fazem parte da cultura
            do Maranhão.
          </p>

          <button className="primary-button" onClick={() => navegar('busca')}>
            Descobrir Maranhão
          </button>
        </div>
      </section>
    </div>
  );
}

/*BUSCA*/

function Busca({
  pesquisa,
  setPesquisa,
  categoriaSelecionada,
  setCategoriaSelecionada,
  resultados,
  favoritos,
  alternarFavorito,
  navegar,
}) {
  return (
    <div className="page">
      <section className="page-heading">
        <span className="eyebrow">EXPLORAR AFROMA</span>

        <h1>Pesquisa</h1>

        <p>Encontre conteúdos sobre cultura afro-brasileira.</p>
      </section>

      <div className="search-box large">
        <span>🔎</span>

        <input
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          placeholder="Digite uma palavra-chave..."
          autoFocus
        />
      </div>

      <div className="filter-row">
        <button
          className={categoriaSelecionada === 'todos' ? 'active' : ''}
          onClick={() => setCategoriaSelecionada('todos')}
        >
          Todos
        </button>

        {categorias.map((categoria) => (
          <button
            key={categoria.id}
            className={categoriaSelecionada === categoria.id ? 'active' : ''}
            onClick={() => setCategoriaSelecionada(categoria.id)}
          >
            {categoria.icone} {categoria.nome}
          </button>
        ))}
      </div>

      <div className="results-count">
        {resultados.length} conteúdo(s) encontrado(s)
      </div>

      <div className="content-grid">
        {resultados.map((conteudo) => (
          <ContentCard
            key={conteudo.id}
            conteudo={conteudo}
            favorito={favoritos.includes(String(conteudo.id))}
            alternarFavorito={alternarFavorito}
            navegar={navegar}
          />
        ))}
      </div>

      {resultados.length === 0 && (
        <EmptyState
          titulo="Nenhum conteúdo encontrado"
          descricao={`Tente termos como ${['Tambor de Crioula', 'Reggae Maranhense', 'Tambor de Mina'].join(', ')}.`}
        />
      )}
    </div>
  );
}



function ContentCard({ conteudo, favorito, alternarFavorito, navegar }) {
  const categoria = categorias.find((item) => item.id === conteudo.categoria);
  const videoUrl = safeMediaUrl(conteudo.video);
  const imageUrl = safeMediaUrl(conteudo.imagem);

  return (
    <article className="content-card">
      <div className="content-card-image">
        {videoUrl
          ? <video src={videoUrl} controls aria-label={`Vídeo: ${conteudo.titulo}`} />
          : imageUrl
            ? <img src={imageUrl} alt={`Imagem ilustrativa: ${conteudo.titulo}`} />
            : <div className="media-placeholder" role="img" aria-label={`Sem mídia para ${conteudo.titulo}`}>Sem mídia</div>}

        <button
          className={favorito ? 'favorite-button liked' : 'favorite-button'}
          onClick={() => alternarFavorito(conteudo.id)}
          aria-label={
            favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'
          }
        >
          {favorito ? '♥' : '♡'}
        </button>
      </div>

      <div className="content-card-body">
        <span className="card-category">
          {categoria?.icone} {categoria?.nome}
        </span>

        <h3>{conteudo.titulo}</h3>

        <p>{conteudo.resumo}</p>

        <button
          className="card-link"
          onClick={() => navegar(`detalhe-${conteudo.id}`)}
        >
          Ler conteúdo →
        </button>
      </div>
    </article>
  );
}



function Detalhe({ id, conteudos, favoritos, alternarFavorito, navegar }) {
  const conteudo = conteudos.find((item) => item.id === id);

  if (!conteudo) {
    return (
      <EmptyState
        titulo="Conteúdo não encontrado"
        descricao="Este conteúdo não existe."
      />
    );
  }

  const categoria = categorias.find((item) => item.id === conteudo.categoria);
  const videoUrl = safeMediaUrl(conteudo.video);
  const imageUrl = safeMediaUrl(conteudo.imagem);

  return (
    <div className="page">
      <button className="back-button" onClick={() => navegar('busca')}>
        ← Voltar
      </button>

      <article className="detail-page">
        {videoUrl
          ? <video src={videoUrl} controls className="detail-image" aria-label={`Vídeo: ${conteudo.titulo}`} />
          : imageUrl
            ? <img src={imageUrl} alt={`Imagem ilustrativa de ${conteudo.titulo}`} className="detail-image" />
            : <div className="detail-image media-placeholder" role="img" aria-label={`Sem mídia para ${conteudo.titulo}`}>Sem mídia</div>}

        <div className="detail-content">
          <span className="eyebrow">
            {categoria?.icone} {categoria?.nome}
          </span>

          <h1>{conteudo.titulo}</h1>

          <p className="detail-lead">{conteudo.resumo}</p>

          <div className="detail-actions">
            <button
              className={
                favoritos.includes(String(conteudo.id))
                  ? 'primary-button liked'
                  : 'primary-button'
              }
              onClick={() => alternarFavorito(conteudo.id)}
            >
              {favoritos.includes(String(conteudo.id)) ? '♥ Favoritado' : '♡ Favoritar'}
            </button>

            <button
              className="secondary-button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: conteudo.titulo,
                    text: conteudo.resumo,
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);

                  alert('Link copiado!');
                }
              }}
            >
              ↗ Compartilhar
            </button>
          </div>

          <div className="detail-text">
            <h2>Sobre este conteúdo</h2>

            <p>
              A cultura afro-brasileira representa uma parte fundamental da
              identidade brasileira. Suas manifestações estão presentes na
              música, na dança, na culinária, na religiosidade, na literatura,
              nas festas e na memória das comunidades.
            </p>

            <p>
              No Maranhão, essas tradições possuem características próprias e se
              expressam através de manifestações como o Tambor de Crioula, o
              Tambor de Mina, o reggae maranhense e diversas expressões
              culinárias.
            </p>

            <h2>Cultura e memória</h2>

            <p>
              Preservar essas manifestações significa valorizar os saberes
              transmitidos entre gerações e reconhecer a contribuição dos povos
              africanos e de seus descendentes para a formação do Brasil.
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}


function Favoritos({ conteudos, favoritos, alternarFavorito, navegar }) {
  const lista = conteudos.filter((item) => favoritos.includes(String(item.id)));

  return (
    <div className="page">
      <section className="page-heading">
        <span className="eyebrow">SUA COLEÇÃO</span>

        <h1>Favoritos ❤️</h1>

        <p>Conteúdos que você escolheu guardar.</p>
      </section>

      {lista.length > 0 ? (
        <div className="content-grid">
          {lista.map((conteudo) => (
            <ContentCard
              key={conteudo.id}
              conteudo={conteudo}
              favorito={true}
              alternarFavorito={alternarFavorito}
              navegar={navegar}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          titulo="Você ainda não tem favoritos"
          descricao="Explore o AFROMA e salve os conteúdos que mais gostar."
          botao="Explorar conteúdos"
          onClick={() => navegar('busca')}
        />
      )}
    </div>
  );
}



function dataEventoISO(data) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(data || '')) return data;
  const [dia, mes, ano] = (data || '').split('/');
  return ano ? `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}` : '';
}

function dataEventoLegivel(data) {
  const iso = dataEventoISO(data);
  if (!iso) return data || '';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function Calendario({ eventos }) {
  const [mesAtual, setMesAtual] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [diaSelecionado, setDiaSelecionado] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  });
  const ano = mesAtual.getFullYear();
  const mes = mesAtual.getMonth();
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const nomeMes = mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const eventosDoDia = eventos.filter(ev => dataEventoISO(ev.data) === diaSelecionado);
  const eventosFuturos = eventos.filter(ev => {
    const data = new Date(`${dataEventoISO(ev.data)}T00:00:00`);
    return data >= new Date(new Date().setHours(0, 0, 0, 0));
  }).sort((a, b) => {
    return dataEventoISO(a.data).localeCompare(dataEventoISO(b.data));
  });
  const dias = Array.from({ length: primeiroDia + totalDias }, (_, i) => i < primeiroDia ? null : i - primeiroDia + 1);
  function mudarMes(delta) { setMesAtual(new Date(ano, mes + delta, 1)); }
  function isoDia(d) { return `${ano}-${String(mes + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
  function temEvento(d) { return eventos.some(ev => dataEventoISO(ev.data) === isoDia(d)); }

  return (
    <div className="page">
      <section className="page-heading">
        <span className="eyebrow">AGENDA CULTURAL</span>
        <h1>Calendário de eventos</h1>
        <p>Selecione uma data para consultar as programações culturais.</p>
      </section>
      <section className="calendar-panel" aria-label="Calendário mensal">
        <div className="calendar-month">
          <button className="rounded-setting-button" onClick={() => mudarMes(-1)} aria-label="Mês anterior">‹</button>
          <h2>{nomeMes}</h2>
          <button className="rounded-setting-button" onClick={() => mudarMes(1)} aria-label="Próximo mês">›</button>
        </div>
        <div className="calendar-grid">
          {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => <strong key={d}>{d}</strong>)}
          {dias.map((d, i) => d ? <button key={i} className={`${diaSelecionado === isoDia(d) ? 'selected' : ''} ${temEvento(d) ? 'has-event' : ''}`} onClick={() => setDiaSelecionado(isoDia(d))} aria-label={`${d} de ${nomeMes}${temEvento(d) ? ', possui evento' : ''}`}>{d}{temEvento(d) && <i />}</button> : <span key={i} />)}
        </div>
        <p className="calendar-legend"><i /> Datas com eventos cadastrados</p>
      </section>
      <section className="calendar-results">
        <h2>Programação do dia</h2>
        {eventosDoDia.length ? eventosDoDia.map(ev => <article className="event-card" key={ev.id}>
          <div className="event-date"><strong>{dataEventoLegivel(ev.data).split('/')[0]}</strong><span>{dataEventoLegivel(ev.data).split('/')[1]}</span></div>
          <div className="event-content"><span>📅 {dataEventoLegivel(ev.data)} {ev.hora ? `· ${ev.hora}` : ''}</span><h2>{ev.titulo}</h2><strong>📍 {ev.local}</strong><p>{ev.descricao}</p></div>
        </article>) : <EmptyState titulo="Nenhum evento nesta data" descricao="Confira os próximos eventos cadastrados na agenda." />}
      </section>
      <section className="calendar-results">
        <h2>Próximos eventos</h2>
        {eventosFuturos.length ? eventosFuturos.map(ev => <article className="event-card" key={ev.id}>
          <div className="event-date"><strong>{dataEventoLegivel(ev.data).split('/')[0]}</strong><span>{dataEventoLegivel(ev.data).split('/')[1]}</span></div>
          <div className="event-content"><span>📅 {dataEventoLegivel(ev.data)} {ev.hora ? `· ${ev.hora}` : ''}</span><h2>{ev.titulo}</h2><strong>📍 {ev.local}</strong><p>{ev.descricao}</p></div>
        </article>) : <p>Não há próximos eventos cadastrados.</p>}
      </section>
    </div>
  );
}


function Perfil({
  usuario,
  navegar,
  tamanhoFonte,
  setTamanhoFonte,
  leitorTela,
  setLeitorTela,
  tema,
  setTema,
  logout,
  excluirMinhaConta,
  aviso,
}) {
  return (
    <div className="page">
      <section className="page-heading">
        <span className="eyebrow">MINHA CONTA</span>

        <h1>Perfil</h1>
      </section>

      <div className="profile-card">
        <div className="profile-avatar">
          {usuario ? usuario.nome.charAt(0).toUpperCase() : '👤'}
        </div>

        <h2>{usuario ? usuario.nome : 'Visitante'}</h2>

        <p>{usuario ? usuario.email : 'Você ainda não está conectado.'}</p>

        {!usuario && (
          <button className="primary-button" onClick={() => navegar('login')}>
            Entrar na conta
          </button>
        )}
      </div>

      <section className="settings">
        <h2>Acessibilidade</h2>

        <div className="setting">
          <div>
            <strong>Tamanho da fonte</strong>

            <p>Ajuste o tamanho dos textos.</p>
          </div>

          <div className="font-buttons">
            <button
              className={tamanhoFonte === 'pequena' ? 'active' : ''}
              onClick={() => setTamanhoFonte('pequena')}
            >
              A
            </button>

            <button
              className={tamanhoFonte === 'normal' ? 'active' : ''}
              onClick={() => setTamanhoFonte('normal')}
            >
              A+
            </button>

            <button
              className={tamanhoFonte === 'grande' ? 'active' : ''}
              onClick={() => setTamanhoFonte('grande')}
            >
              A++
            </button>
          </div>
        </div>

        <div className="setting">
          <div>
            <strong>Descrições para leitor de tela</strong>
            <p>Ative anúncios de atualização e descrições acessíveis. O TalkBack e o VoiceOver continuam sendo controlados pelo dispositivo.</p>
          </div>
          <button className="rounded-setting-button" role="switch" aria-checked={leitorTela} onClick={() => setLeitorTela(!leitorTela)}>
            {leitorTela ? 'Ativado' : 'Desativado'}
          </button>
        </div>

        <div className="setting">
          <div>
            <strong>Tema</strong>

            <p>Escolha a aparência do aplicativo.</p>
          </div>

          <button
            className="rounded-setting-button"
            onClick={() => setTema(tema === 'claro' ? 'escuro' : 'claro')}
          >
            {tema === 'claro' ? '☀️ Claro' : '🌙 Escuro'}
          </button>
        </div>
      </section>

      <section className="settings">
        <h2>Conta</h2>

        {aviso && <p className="form-alert" role="status">{aviso}</p>}
        {usuario
          ? <>
              <button className="logout-button" onClick={logout}>Sair da conta</button>
              <button className="delete-account-button" onClick={excluirMinhaConta}>Excluir minha conta e dados</button>
            </>
          : <button className="primary-button" onClick={() => navegar('login')}>Entrar na conta</button>}
      </section>
    </div>
  );
}



function Login({
  realizarLogin,
  recuperarSenha,
  navegar,
  aviso,
  setCaptchaToken,
  captchaResetKey,
  cooldownSeconds,
  authPending,
}) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">AFROMA</div>

        <span className="eyebrow">BEM-VINDO DE VOLTA</span>

        <h1>Entrar</h1>

        <p>Acesse sua experiência AFROMA.</p>

        {aviso && <p className="form-alert" role="alert">{aviso}</p>}
        {cooldownSeconds > 0 && (
          <p className="cooldown-notice" role="status" aria-live="polite">
            Aguarde {cooldownSeconds} segundo(s) para tentar novamente.
          </p>
        )}
        <CaptchaWidget onToken={setCaptchaToken} resetKey={captchaResetKey} />
        <form onSubmit={realizarLogin}>
          <label htmlFor="login-email">E-mail</label>

          <input
            id="login-email"
            name="email"
            type="email"
            required
            placeholder="seu@email.com"
          />

          <label htmlFor="login-senha">Senha</label>

          <input
            id="login-senha"
            name="senha"
            type="password"
            required
            placeholder="Sua senha"
          />

          <button className="primary-button full" type="submit" disabled={authPending || cooldownSeconds > 0}>
            {authPending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <form className="recovery-form" onSubmit={recuperarSenha}>
          <label htmlFor="recovery-email">Esqueceu a senha? Informe seu e-mail</label>
          <input id="recovery-email" name="email" type="email" required placeholder="seu@email.com" />
          <button type="submit" disabled={authPending || cooldownSeconds > 0}>
            {authPending ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>
        </form>

        <div className="security-note">
          🔐 Sua senha é gerenciada com segurança pelo Supabase Auth.
        </div>

        <p className="auth-footer">
          Ainda não possui conta?
          <button onClick={() => navegar('cadastro')}>Criar conta</button>
        </p>
      </div>
    </div>
  );
}



function Cadastro({
  realizarCadastro,
  navegar,
  aviso,
  setCaptchaToken,
  captchaResetKey,
  cooldownSeconds,
  authPending,
}) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">AFROMA</div>

        <span className="eyebrow">JUNTE-SE À COMUNIDADE</span>

        <h1>Criar conta</h1>

        <p>Salve seus conteúdos e monte suas coleções culturais.</p>

        {aviso && <p className="form-alert" role="alert">{aviso}</p>}
        {cooldownSeconds > 0 && (
          <p className="cooldown-notice" role="status" aria-live="polite">
            Aguarde {cooldownSeconds} segundo(s) para tentar novamente.
          </p>
        )}
        <CaptchaWidget onToken={setCaptchaToken} resetKey={captchaResetKey} />
        <form onSubmit={realizarCadastro}>
          <label htmlFor="cadastro-nome">Nome</label>

          <input id="cadastro-nome" name="nome" required placeholder="Seu nome" autoComplete="name" />

          <label htmlFor="cadastro-email">E-mail</label>

          <input
            id="cadastro-email"
            name="email"
            type="email"
            required
            placeholder="seu@email.com"
            autoComplete="email"
          />

          <label htmlFor="cadastro-senha">Senha</label>

          <input
            id="cadastro-senha"
            name="senha"
            type="password"
            required
            minLength="6"
            placeholder="Crie uma senha"
            autoComplete="new-password"
          />

          <button className="primary-button full" type="submit" disabled={authPending || cooldownSeconds > 0}>
            {authPending ? 'Criando conta...' : 'Criar minha conta'}
          </button>
        </form>

        <div className="security-note">
          🔐 Sua senha é armazenada e protegida pelo Supabase Auth.
        </div>

        <p className="auth-footer">
          Já possui uma conta?
          <button onClick={() => navegar('login')}>Entrar</button>
        </p>
      </div>
    </div>
  );
}

function RedefinirSenha({ atualizarSenha, aviso }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">AFROMA</div>
        <span className="eyebrow">RECUPERAÇÃO DE CONTA</span>
        <h1>Nova senha</h1>
        <p>Defina uma nova senha para acessar sua conta.</p>
        {aviso && <p className="form-alert" role="alert">{aviso}</p>}
        <form onSubmit={atualizarSenha}>
          <label htmlFor="nova-senha">Nova senha</label>
          <input id="nova-senha" name="senha" type="password" minLength="6" required autoComplete="new-password" />
          <label htmlFor="confirmar-senha">Confirme a nova senha</label>
          <input id="confirmar-senha" name="confirmacao" type="password" minLength="6" required autoComplete="new-password" />
          <button className="primary-button full" type="submit">Salvar nova senha</button>
        </form>
      </div>
    </div>
  );
}


function Admin({ conteudos, eventos, musicas, usuario, salvarConteudo, removerConteudo, salvarMusica, removerMusica, salvarEvento, removerEvento, enviarMidia, navegar }) {
  const [erroAdmin, setErroAdmin] = useState('');
  const [conteudoEmEdicao, setConteudoEmEdicao] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [resumo, setResumo] = useState('');
  const [categoria, setCategoria] = useState('historia');
  const [midia, setMidia] = useState('');
  const [tipoMidia, setTipoMidia] = useState('imagem');
  const [arquivoMidia, setArquivoMidia] = useState(null);
  const arquivoConteudoRef = useRef(null);
  const [musicaEmEdicao, setMusicaEmEdicao] = useState(null);
  const [formMusica, setFormMusica] = useState({
    titulo: '',
    artista: '',
    genero: '',
    regiao: '',
    ano: '',
    duracao: '',
    imagem: '',
    youtubeId: '',
    descricao: '',
  });
  const [eventoTitulo, setEventoTitulo] = useState('');
  const [eventoData, setEventoData] = useState('');
  const [eventoHora, setEventoHora] = useState('');
  const [eventoLocal, setEventoLocal] = useState('');
  const [eventoDescricao, setEventoDescricao] = useState('');

  if (!usuario || usuario.role !== 'admin') return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="eyebrow">ÁREA RESTRITA</span>
        <h1>Administrador</h1>
        <p>{usuario ? 'Sua conta não possui permissão administrativa.' : 'Entre com a conta autorizada como administradora para acessar o painel.'}</p>
        <button className="secondary-button full" onClick={() => navegar('home')}>Voltar para o aplicativo</button>
        {!usuario && <button className="primary-button full" onClick={() => navegar('login')}>Entrar na conta</button>}
      </div>
    </div>
  );

  function selecionarMidia(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    if (arquivo.size > 20 * 1024 * 1024) {
      setErroAdmin('O arquivo ultrapassa 20 MB. Escolha uma mídia menor.');
      e.target.value = '';
      return;
    }
    const formatosPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
    if (!formatosPermitidos.includes(arquivo.type)) {
      setErroAdmin('Formato não aceito. Use JPG, PNG, WebP, GIF, MP4 ou WebM.');
      e.target.value = '';
      return;
    }
    setErroAdmin('');
    setArquivoMidia(arquivo);
    setTipoMidia(arquivo.type.startsWith('video/') ? 'video' : 'imagem');
    const leitor = new FileReader();
    leitor.onload = () => setMidia(String(leitor.result));
    leitor.readAsDataURL(arquivo);
  }

  function limparFormularioConteudo() {
    setConteudoEmEdicao(null);
    setTitulo('');
    setResumo('');
    setCategoria('historia');
    setMidia('');
    setTipoMidia('imagem');
    setArquivoMidia(null);
    if (arquivoConteudoRef.current) arquivoConteudoRef.current.value = '';
  }

  function prepararEdicaoConteudo(item) {
    setConteudoEmEdicao(item.id);
    setTitulo(item.titulo);
    setResumo(item.resumo);
    setCategoria(item.categoria);
    setMidia(item.video || item.imagem || '');
    setTipoMidia(item.video ? 'video' : 'imagem');
    setArquivoMidia(null);
    if (arquivoConteudoRef.current) arquivoConteudoRef.current.value = '';
    setErroAdmin('');
    document.getElementById('content-title')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function salvarConteudoFormulario(e) {
    e.preventDefault();
    setErroAdmin('');
    try {
      const urlMidia = arquivoMidia ? await enviarMidia(arquivoMidia) : midia;
      await salvarConteudo({
        categoria,
        titulo: titulo.trim(),
        resumo: resumo.trim(),
        imagem: tipoMidia === 'imagem' ? urlMidia : '',
        video: tipoMidia === 'video' ? urlMidia : '',
      }, conteudoEmEdicao);
      limparFormularioConteudo();
    } catch (error) {
      setErroAdmin(`Não foi possível ${conteudoEmEdicao ? 'atualizar' : 'publicar'} o conteúdo: ${getSupabaseError(error)}`);
    }
  }

  function atualizarCampoMusica(campo, valor) {
    setFormMusica(formulario => ({ ...formulario, [campo]: valor }));
  }

  function prepararEdicaoMusica(musica) {
    setMusicaEmEdicao(musica.id);
    setFormMusica({
      titulo: musica.titulo,
      artista: musica.artista,
      genero: musica.genero,
      regiao: musica.regiao,
      ano: musica.ano,
      duracao: musica.duracao,
      imagem: musica.imagem,
      youtubeId: musica.youtubeId,
      descricao: musica.descricao,
    });
    setErroAdmin('');
    document.getElementById('music-title')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function limparFormularioMusica() {
    setMusicaEmEdicao(null);
    setFormMusica({
      titulo: '',
      artista: '',
      genero: '',
      regiao: '',
      ano: '',
      duracao: '',
      imagem: '',
      youtubeId: '',
      descricao: '',
    });
  }

  async function salvarMusicaFormulario(e) {
    e.preventDefault();
    const youtubeId = formMusica.youtubeId.trim();
    if (!/^[A-Za-z0-9_-]{11}$/.test(youtubeId)) {
      setErroAdmin('Informe o ID válido de 11 caracteres do vídeo no YouTube.');
      return;
    }
    try {
      await salvarMusica({ ...formMusica, youtubeId }, musicaEmEdicao);
      limparFormularioMusica();
      setErroAdmin('');
    } catch (error) {
      setErroAdmin(`Não foi possível salvar a música: ${getSupabaseError(error)}`);
    }
  }

  async function excluirMusica(musica) {
    if (!window.confirm(`Excluir a música "${musica.titulo}"?`)) return;
    try {
      await removerMusica(musica.id);
      if (musicaEmEdicao === musica.id) limparFormularioMusica();
      setErroAdmin('');
    } catch (error) {
      setErroAdmin(`Não foi possível excluir a música: ${getSupabaseError(error)}`);
    }
  }

  async function excluirConteudo(id) {
    if (window.confirm('Tem certeza que deseja excluir este conteúdo?')) {
      try {
        await removerConteudo(id);
        if (conteudoEmEdicao === id) limparFormularioConteudo();
        setErroAdmin('');
      } catch (error) {
        setErroAdmin(`Não foi possível excluir o conteúdo: ${getSupabaseError(error)}`);
      }
    }
  }

  async function adicionarEvento(e) {
    e.preventDefault();
    try {
      await salvarEvento({
        titulo: eventoTitulo.trim(),
        data: eventoData,
        hora: eventoHora,
        local: eventoLocal.trim(),
        descricao: eventoDescricao.trim(),
      });
      setEventoTitulo(''); setEventoData(''); setEventoHora(''); setEventoLocal(''); setEventoDescricao('');
      setErroAdmin('');
    } catch (error) {
      setErroAdmin(`Não foi possível salvar o evento: ${getSupabaseError(error)}`);
    }
  }

  async function excluirEvento(id) {
    if (window.confirm('Cancelar/excluir este evento?')) {
      try {
        await removerEvento(id);
        setErroAdmin('');
      } catch (error) {
        setErroAdmin(`Não foi possível excluir o evento: ${getSupabaseError(error)}`);
      }
    }
  }

  async function editarEvento(evento) {
    const tituloNovo = window.prompt('Título do evento:', evento.titulo);
    if (tituloNovo === null || !tituloNovo.trim()) return;
    const dataNova = window.prompt('Data do evento (AAAA-MM-DD):', dataEventoISO(evento.data));
    if (dataNova === null) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataNova)) {
      setErroAdmin('Informe a data no formato AAAA-MM-DD.');
      return;
    }
    const localNovo = window.prompt('Local:', evento.local || '');
    if (localNovo === null) return;
    const descricaoNova = window.prompt('Descrição:', evento.descricao || '');
    if (descricaoNova === null) return;
    const horaNova = window.prompt('Horário (HH:MM):', evento.hora || '');
    if (horaNova === null) return;
    try {
      await salvarEvento({
        ...evento,
        titulo: tituloNovo.trim(),
        data: dataNova,
        local: localNovo.trim(),
        descricao: descricaoNova.trim(),
        hora: horaNova.trim(),
      }, evento.id);
      setErroAdmin('');
    } catch (error) {
      setErroAdmin(`Não foi possível editar o evento: ${getSupabaseError(error)}`);
    }
  }

  return (
    <div className="page admin-page">
      <section className="page-heading">
        <span className="eyebrow">AFROMA CMS</span>
        <h1>Painel Administrativo</h1>
        <p>Gerencie publicações, mídias e eventos culturais.</p>
      </section>
      {erroAdmin && <p className="form-alert" role="alert">{erroAdmin}</p>}

      <section className="admin-section">
        <h2>{conteudoEmEdicao ? 'Editar conteúdo cultural' : 'Novo conteúdo cultural'}</h2>
        <form className="admin-form" onSubmit={salvarConteudoFormulario}>
          <label htmlFor="content-title">Título</label>
          <input id="content-title" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título da publicação" maxLength={120} required />
          <label htmlFor="content-category">Categoria</label>
          <select id="content-category" value={categoria} onChange={e => setCategoria(e.target.value)}>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <label htmlFor="content-summary">Descrição</label>
          <textarea id="content-summary" value={resumo} onChange={e => setResumo(e.target.value)} placeholder="Conte um pouco sobre este conteúdo" maxLength={3000} required />
          <label htmlFor="content-media">Imagem ou vídeo (máximo 20 MB)</label>
          <input ref={arquivoConteudoRef} id="content-media" type="file" accept="image/*,video/*" onChange={selecionarMidia} />
          {midia && <label htmlFor="content-media-type">Tipo da mídia</label>}
          {midia && (
            <select id="content-media-type" value={tipoMidia} onChange={e => setTipoMidia(e.target.value)}>
              <option value="imagem">Imagem</option>
              <option value="video">Vídeo</option>
            </select>
          )}
          {midia && (tipoMidia === 'imagem'
            ? <img className="admin-media-preview" src={safeMediaUrl(midia)} alt="Prévia da imagem selecionada" />
            : <video className="admin-media-preview" src={safeMediaUrl(midia)} controls aria-label="Prévia do vídeo selecionado" />)}
          {midia && (
            <button type="button" className="secondary-button" onClick={() => {
              setMidia('');
              setArquivoMidia(null);
              if (arquivoConteudoRef.current) arquivoConteudoRef.current.value = '';
            }}>
              Remover mídia
            </button>
          )}
          <button className="primary-button" type="submit">
            {conteudoEmEdicao ? 'Salvar alterações' : '+ Publicar conteúdo'}
          </button>
          {conteudoEmEdicao && (
            <button type="button" className="secondary-button" onClick={limparFormularioConteudo}>Cancelar edição</button>
          )}
        </form>
      </section>

      <section className="admin-section">
        <h2>Conteúdos cadastrados ({conteudos.length})</h2>
        <div className="admin-list">
          {conteudos.map(item => (
            <div className="admin-item" key={item.id}>
              <div><strong>{item.titulo}</strong><span>{categorias.find(c => c.id === item.categoria)?.nome || item.categoria}</span></div>
              <div className="admin-item-actions">
                <button className="rounded-setting-button" onClick={() => prepararEdicaoConteudo(item)} aria-label={`Editar ${item.titulo}`}>Editar</button>
                <button className="delete-button" onClick={() => excluirConteudo(item.id)} aria-label={`Excluir ${item.titulo}`}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <h2>{musicaEmEdicao ? 'Editar música' : 'Adicionar música'}</h2>
        <form className="admin-form" onSubmit={salvarMusicaFormulario}>
          <label htmlFor="music-title">Título</label>
          <input id="music-title" value={formMusica.titulo} onChange={e => atualizarCampoMusica('titulo', e.target.value)} maxLength={120} required />
          <label htmlFor="music-artist">Artista</label>
          <input id="music-artist" value={formMusica.artista} onChange={e => atualizarCampoMusica('artista', e.target.value)} maxLength={120} required />
          <label htmlFor="music-genre">Gênero</label>
          <input id="music-genre" value={formMusica.genero} onChange={e => atualizarCampoMusica('genero', e.target.value)} maxLength={100} required />
          <label htmlFor="music-region">Região</label>
          <input id="music-region" value={formMusica.regiao} onChange={e => atualizarCampoMusica('regiao', e.target.value)} maxLength={150} />
          <label htmlFor="music-year">Ano</label>
          <input id="music-year" value={formMusica.ano} onChange={e => atualizarCampoMusica('ano', e.target.value)} inputMode="numeric" pattern="[0-9]{4}" maxLength={4} placeholder="Ex.: 2024" />
          <label htmlFor="music-duration">Duração (minutos:segundos)</label>
          <input id="music-duration" value={formMusica.duracao} onChange={e => atualizarCampoMusica('duracao', e.target.value)} pattern="[0-9]{1,3}:[0-5][0-9]" placeholder="Ex.: 3:45" />
          <label htmlFor="music-image">URL HTTPS da capa</label>
          <input id="music-image" type="url" value={formMusica.imagem} onChange={e => atualizarCampoMusica('imagem', e.target.value)} maxLength={2048} placeholder="https://..." />
          <label htmlFor="music-youtube">ID do vídeo no YouTube (11 caracteres)</label>
          <input id="music-youtube" value={formMusica.youtubeId} onChange={e => atualizarCampoMusica('youtubeId', e.target.value)} pattern="[A-Za-z0-9_-]{11}" maxLength={11} required />
          <label htmlFor="music-description">Descrição</label>
          <textarea id="music-description" value={formMusica.descricao} onChange={e => atualizarCampoMusica('descricao', e.target.value)} maxLength={3000} required />
          <button className="primary-button" type="submit">
            {musicaEmEdicao ? 'Salvar alterações da música' : '+ Publicar música'}
          </button>
          {musicaEmEdicao && (
            <button type="button" className="secondary-button" onClick={limparFormularioMusica}>Cancelar edição</button>
          )}
        </form>
      </section>

      <section className="admin-section">
        <h2>Músicas cadastradas ({musicas.length})</h2>
        <div className="admin-list">
          {musicas.map(musica => (
            <div className="admin-item" key={musica.id}>
              <div><strong>{musica.titulo}</strong><span>{musica.artista} · {musica.genero}</span></div>
              <div className="admin-item-actions">
                <button className="rounded-setting-button" onClick={() => prepararEdicaoMusica(musica)} aria-label={`Editar música ${musica.titulo}`}>Editar</button>
                <button className="delete-button" onClick={() => excluirMusica(musica)} aria-label={`Excluir música ${musica.titulo}`}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <h2>Publicar evento</h2>
        <form className="admin-form" onSubmit={adicionarEvento}>
          <label htmlFor="event-title">Nome do evento</label>
          <input id="event-title" value={eventoTitulo} onChange={e => setEventoTitulo(e.target.value)} maxLength={150} required />
          <label htmlFor="event-date">Data</label>
          <input id="event-date" type="date" value={eventoData} onChange={e => setEventoData(e.target.value)} required />
          <label htmlFor="event-time">Horário</label>
          <input id="event-time" type="time" value={eventoHora} onChange={e => setEventoHora(e.target.value)} required />
          <label htmlFor="event-place">Local</label>
          <input id="event-place" value={eventoLocal} onChange={e => setEventoLocal(e.target.value)} maxLength={180} required />
          <label htmlFor="event-description">Descrição</label>
          <textarea id="event-description" value={eventoDescricao} onChange={e => setEventoDescricao(e.target.value)} maxLength={3000} required />
          <button className="primary-button" type="submit">+ Salvar evento</button>
        </form>
      </section>

      <section className="admin-section">
        <h2>Eventos cadastrados ({eventos.length})</h2>
        <div className="admin-list">
          {eventos.map(evento => <div className="admin-item" key={evento.id}>
            <div><strong>{evento.titulo}</strong><span>{evento.data} {evento.hora || ''} · {evento.local}</span></div>
            <div className="admin-item-actions">
              <button className="rounded-setting-button" onClick={() => editarEvento(evento)}>Editar</button>
              <button className="delete-button" onClick={() => excluirEvento(evento.id)} aria-label={`Excluir evento ${evento.titulo}`}>🗑️</button>
            </div>
          </div>)}
        </div>
      </section>

      <button className="logout-button" onClick={() => navegar('perfil')}>Voltar ao perfil</button>
    </div>
  );
}

/*BOTTOM NAVIGATION*/

function BottomNavigation({ tela, navegar }) {
  return (
    <nav className="bottom-navigation">
      <button
        className={tela === 'home' ? 'active' : ''}
        onClick={() => navegar('home')}
      >
        <span>🏠</span>
        <small>Home</small>
      </button>

      <button
        className={tela === 'busca' ? 'active' : ''}
        onClick={() => navegar('busca')}
      >
        <span>🔎</span>
        <small>Busca</small>
      </button>

      <button
        className={tela === 'musica' ? 'active' : ''}
        onClick={() => navegar('musica')}
      >
        <span>🎵</span>
        <small>Música</small>
      </button>

      <button
        className={tela === 'favoritos' ? 'active' : ''}
        onClick={() => navegar('favoritos')}
      >
        <span>♥</span>
        <small>Favoritos</small>
      </button>

      <button
        className={tela === 'calendario' ? 'active' : ''}
        onClick={() => navegar('calendario')}
      >
        <span>📅</span>
        <small>Eventos</small>
      </button>

      <button
        className={tela === 'perfil' ? 'active' : ''}
        onClick={() => navegar('perfil')}
      >
        <span>👤</span>
        <small>Perfil</small>
      </button>
    </nav>
  );
}

/*EMPTY STATE*/

function EmptyState({ titulo, descricao, botao, onClick }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">✨</div>

      <h2>{titulo}</h2>

      <p>{descricao}</p>

      {botao && (
        <button className="primary-button" onClick={onClick}>
          {botao}
        </button>
      )}
    </div>
  );
}
