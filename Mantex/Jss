const { createClient } = supabase
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

let usuarioAtual = null
let veiculos = []
let manutencoes = []
let documentos = []

// =================== AUTH ===================

async function fazerLogin() {
  const email = document.getElementById('login-email').value.trim()
  const senha = document.getElementById('login-password').value
  const err = document.getElementById('login-error')
  err.style.display = 'none'
  if (!email || !senha) { err.textContent = 'Preencha e-mail e senha.'; err.style.display = 'block'; return }
  const { data, error } = await db.auth.signInWithPassword({ email, password: senha })
  if (error) { err.textContent = 'E-mail ou senha incorretos.'; err.style.display = 'block'; return }
  usuarioAtual = data.user
  iniciarApp()
}

async function fazerRegistro() {
  const nome = document.getElementById('reg-nome').value.trim()
  const email = document.getElementById('reg-email').value.trim()
  const senha = document.getElementById('reg-password').value
  const err = document.getElementById('reg-error')
  err.style.display = 'none'
  if (!nome || !email || !senha) { err.textContent = 'Preencha todos os campos.'; err.style.display = 'block'; return }
  if (senha.length < 6) { err.textContent = 'Senha deve ter no mínimo 6 caracteres.'; err.style.display = 'block'; return }
  const { error } = await db.auth.signUp({ email, password: senha, options: { data: { nome } } })
  if (error) { err.textContent = error.message; err.style.display = 'block'; return }
  mostrarLogin()
  toast('Conta criada! Faça login para continuar.')
}

async function fazerLogout() {
  await db.auth.signOut()
  document.getElementById('app').style.display = 'none'
  document.getElementById('login-screen').style.display = 'flex'
  usuarioAtual = null
}

function mostrarLogin() {
  document.getElementById('register-screen').style.display = 'none'
  document.getElementById('login-screen').style.display = 'flex'
}

function mostrarRegistro() {
  document.getElementById('login-screen').style.display = 'none'
  document.getElementById('register-screen').style.display = 'flex'
}

async function verificarSessao() {
  const { data: { session } } = await db.auth.getSession()
  if (session) { usuarioAtual = session.user; iniciarApp() }
  else document.getElementById('login-screen').style.display = 'flex'
}

function iniciarApp() {
  document.getElementById('login-screen').style.display = 'none'
  document.getElementById('register-screen').style.display = 'none'
  document.getElementById('app').style.display = 'flex'
  const nome = usuarioAtual?.user_metadata?.nome || usuarioAtual?.email || '—'
  document.getElementById('user-name-sidebar').textContent = nome
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  document.getElementById('data-hoje').textContent = hoje.charAt(0).toUpperCase() + hoje.slice(1)
  carregarTudo()
}

// =================== NAVEGAÇÃO ===================

function ir(pagina, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'))
  document.getElementById('page-' + pagina).classList.add('active')
  const navEl = el instanceof Element ? el : document.querySelector(`.nav-item[onclick*="'${pagina}'"]`)
  if (navEl) navEl.classList.add('active')
  if (pagina === 'dashboard') renderDashboard()
  if (pagina === 'veiculos') renderVeiculos()
  if (pagina === 'manutencoes') renderManutencoes()
  if (pagina === 'documentos') renderDocumentos()
  if (pagina === 'relatorios') renderRelatorios()
}

// =================== DADOS ===================

async function carregarTudo() {
  await Promise.all([carregarVeiculos(), carregarManutencoes(), carregarDocumentos()])
  renderDashboard()
}

async function carregarVeiculos() {
  const { data } = await db.from('veiculos').select('*').order('placa')
  veiculos = data || []
}

async function carregarManutencoes() {
  const { data } = await db.from('manutencoes').select('*').order('criado_em', { ascending: false })
  manutencoes = data || []
}

async function carregarDocumentos() {
  const { data } = await db.from('documentos').select('*').order('vencimento')
  documentos = data || []
}

// =================== DASHBOARD ===================

function renderDashboard() {
  const totalVei = veiculos.length
  const emMan = veiculos.filter(v => v.status === 'manutencao').length
  const totalMan = manutencoes.length
  const pendentes = manutencoes.filter(m => m.status === 'pendente').length
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const em30 = new Date(hoje); em30.setDate(em30.getDate() + 30)
  const docVencidos = documentos.filter(d => new Date(d.vencimento) < hoje).length
  const docAVencer = documentos.filter(d => { const v = new Date(d.vencimento); return v >= hoje && v <= em30 }).length

  document.getElementById('kpi-dashboard').innerHTML = `
    <div class="kpi"><div class="kpi-label">Veículos ativos</div><div class="kpi-val blue">${totalVei}</div></div>
    <div class="kpi"><div class="kpi-label">Em manutenção</div><div class="kpi-val yellow">${emMan}</div></div>
    <div class="kpi"><div class="kpi-label">OS pendentes</div><div class="kpi-val orange">${pendentes}</div></div>
    <div class="kpi"><div class="kpi-label">Total de OS</div><div class="kpi-val">${totalMan}</div></div>
    <div class="kpi"><div class="kpi-label">Docs vencidos</div><div class="kpi-val red">${docVencidos}</div></div>
    <div class="kpi"><div class="kpi-label">Docs a vencer (30d)</div><div class="kpi-val yellow">${docAVencer}</div></div>
  `

  // Alertas
  const alertas = []
  documentos.forEach(d => {
    const v = new Date(d.vencimento)
    const vei = veiculos.find(vv => vv.id === d.veiculo_id)
    const placa = vei?.placa || d.placa || '?'
    if (v < hoje) alertas.push({ tipo: 'danger', icon: '🚨', texto: `<span class="alerta-placa">${placa}</span> — ${labelDoc(d.tipo)} VENCIDO em ${formatarData(d.vencimento)}` })
    else if (v <= em30) alertas.push({ tipo: 'warning', icon: '⚠️', texto: `<span class="alerta-placa">${placa}</span> — ${labelDoc(d.tipo)} vence em ${formatarData(d.vencimento)}` })
  })

  const sec = document.getElementById('alertas-section')
  sec.innerHTML = alertas.length
    ? alertas.slice(0, 5).map(a => `<div class="alerta ${a.tipo}"><span class="alerta-icon">${a.icon}</span><span class="alerta-text">${a.texto}</span></div>`).join('')
    : ''

  // Gráficos
  const porStatus = { pendente: 0, andamento: 0, concluido: 0 }
  manutencoes.forEach(m => { if (porStatus[m.status] !== undefined) porStatus[m.status]++ })
  renderBarChart('chart-status', [
    { label: 'Pendente', count: porStatus.pendente, color: '#f59e0b' },
    { label: 'Andamento', count: porStatus.andamento, color: '#3b82f6' },
    { label: 'Concluído', count: porStatus.concluido, color: '#22c55e' },
  ])

  const porTipo = { oleo: 0, pneus: 0, revisao: 0, corretiva: 0 }
  manutencoes.forEach(m => { if (porTipo[m.tipo] !== undefined) porTipo[m.tipo]++ })
  renderBarChart('chart-tipo', [
    { label: 'Óleo/Filtros', count: porTipo.oleo, color: '#f97316' },
    { label: 'Pneus', count: porTipo.pneus, color: '#3b82f6' },
    { label: 'Revisão', count: porTipo.revisao, color: '#22c55e' },
    { label: 'Corretiva', count: porTipo.corretiva, color: '#ef4444' },
  ])

  // Recentes
  document.getElementById('tabela-recentes').innerHTML = `
    <thead><tr><th>OS</th><th>Placa</th><th>Tipo</th><th>Contrato</th><th>Status</th><th>Data</th></tr></thead>
    <tbody>${manutencoes.slice(0, 8).map(m => {
      const vei = veiculos.find(v => v.id === m.veiculo_id)
      return `<tr>
        <td><span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#555c72">${m.numero || '—'}</span></td>
        <td><span class="placa">${vei?.placa || m.placa || '—'}</span></td>
        <td style="color:#8b90a0">${labelTipoMan(m.tipo)}</td>
        <td style="color:#8b90a0">${vei?.contrato || '—'}</td>
        <td><span class="badge badge-${m.status}">${labelStatus(m.status)}</span></td>
        <td style="color:#8b90a0">${m.data_prevista ? formatarData(m.data_prevista) : '—'}</td>
      </tr>`
    }).join('') || '<tr><td colspan="6"><div class="empty-state">Nenhuma manutenção cadastrada.</div></td></tr>'}</tbody>
  `
}

function renderBarChart(id, items) {
  const max = Math.max(...items.map(i => i.count), 1)
  document.getElementById(id).innerHTML = items.map(i => `
    <div class="bar-row">
      <span class="bar-label">${i.label}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round((i.count/max)*100)}%;background:${i.color}"></div></div>
      <span class="bar-count">${i.count}</span>
    </div>
  `).join('')
}

// =================== VEÍCULOS ===================

function renderVeiculos(lista) {
  if (!lista) lista = veiculos
  atualizarSelectContratos('filtro-contrato-vei', veiculos)
  const grid = document.getElementById('vei-grid')
  if (!lista.length) { grid.innerHTML = '<div class="empty-state"><p>Nenhum veículo cadastrado.</p><p>Clique em "+ Novo veículo" para começar.</p></div>'; return }
  grid.innerHTML = lista.map(v => `
    <div class="vei-card">
      <div class="vei-card-header">
        <div>
          <div class="vei-card-placa">${v.placa}</div>
          <div class="vei-card-modelo">${v.modelo || '—'}</div>
        </div>
        <span class="badge badge-${v.status}">${labelStatusVei(v.status)}</span>
      </div>
      <div class="vei-meta">
        <div class="vei-meta-row"><span class="vei-meta-key">Contrato</span><span class="vei-meta-val">${v.contrato || '—'}</span></div>
        <div class="vei-meta-row"><span class="vei-meta-key">Ano</span><span class="vei-meta-val">${v.ano || '—'}</span></div>
        <div class="vei-meta-row"><span class="vei-meta-key">Hodômetro</span><span class="vei-meta-val">${v.hodometro ? v.hodometro.toLocaleString('pt-BR') + ' km' : '—'}</span></div>
        <div class="vei-meta-row"><span class="vei-meta-key">Chassi</span><span class="vei-meta-val" style="font-family:'JetBrains Mono',monospace;font-size:11px">${v.chassi || '—'}</span></div>
      </div>
      <div class="vei-actions">
        <button class="btn-icon" onclick="editarVei('${v.id}')">✏ Editar</button>
        <button class="btn-icon" onclick="verManVei('${v.placa}')">🔧 OS</button>
        <button class="btn-icon danger" onclick="excluirVei('${v.id}')">🗑</button>
      </div>
    </div>
  `).join('')
}

function filtrarVei() {
  const busca = document.getElementById('busca-vei').value.toLowerCase()
  const contrato = document.getElementById('filtro-contrato-vei').value
  const status = document.getElementById('filtro-status-vei').value
  renderVeiculos(veiculos.filter(v =>
    (!busca || v.placa.toLowerCase().includes(busca) || (v.modelo||'').toLowerCase().includes(busca)) &&
    (!contrato || v.contrato === contrato) &&
    (!status || v.status === status)
  ))
}

function verManVei(placa) {
  ir('manutencoes')
  setTimeout(() => { document.getElementById('busca-man').value = placa; filtrarMan() }, 100)
}

function abrirModalVei(vei) {
  document.getElementById('modal-vei-titulo').textContent = vei ? 'Editar veículo' : 'Novo veículo'
  document.getElementById('vei-edit-id').value = vei?.id || ''
  document.getElementById('vei-placa').value = vei?.placa || ''
  document.getElementById('vei-modelo').value = vei?.modelo || ''
  document.getElementById('vei-ano').value = vei?.ano || ''
  document.getElementById('vei-cor').value = vei?.cor || ''
  document.getElementById('vei-contrato').value = vei?.contrato || ''
  document.getElementById('vei-hodometro').value = vei?.hodometro || ''
  document.getElementById('vei-chassi').value = vei?.chassi || ''
  document.getElementById('vei-status').value = vei?.status || 'ativo'
  document.getElementById('vei-obs').value = vei?.observacoes || ''
  document.getElementById('vei-form-error').style.display = 'none'
  document.getElementById('modal-vei').style.display = 'flex'
}

function fecharModalVei(e) {
  if (e && e.target !== document.getElementById('modal-vei')) return
  document.getElementById('modal-vei').style.display = 'none'
}

async function salvarVei() {
  const id = document.getElementById('vei-edit-id').value
  const placa = document.getElementById('vei-placa').value.trim().toUpperCase()
  const contrato = document.getElementById('vei-contrato').value.trim()
  const err = document.getElementById('vei-form-error')
  err.style.display = 'none'
  if (!placa || !contrato) { err.textContent = 'Placa e contrato são obrigatórios.'; err.style.display = 'block'; return }

  const payload = {
    placa, contrato,
    modelo: document.getElementById('vei-modelo').value.trim() || null,
    ano: parseInt(document.getElementById('vei-ano').value) || null,
    cor: document.getElementById('vei-cor').value.trim() || null,
    hodometro: parseInt(document.getElementById('vei-hodometro').value) || null,
    chassi: document.getElementById('vei-chassi').value.trim() || null,
    status: document.getElementById('vei-status').value,
    observacoes: document.getElementById('vei-obs').value.trim() || null,
    user_id: usuarioAtual.id,
  }

  const { error } = id
    ? await db.from('veiculos').update(payload).eq('id', id)
    : await db.from('veiculos').insert({ ...payload, criado_em: new Date().toISOString() })

  if (error) { err.textContent = 'Erro: ' + error.message; err.style.display = 'block'; return }
  document.getElementById('modal-vei').style.display = 'none'
  toast(id ? 'Veículo atualizado.' : 'Veículo cadastrado.')
  await carregarVeiculos()
  renderVeiculos()
  atualizarSelectsPlaca()
}

function editarVei(id) { abrirModalVei(veiculos.find(v => v.id === id)) }

async function excluirVei(id) {
  if (!confirm('Excluir este veículo?')) return
  const { error } = await db.from('veiculos').delete().eq('id', id)
  if (error) { toast('Erro: ' + error.message); return }
  toast('Veículo excluído.')
  await carregarVeiculos()
  renderVeiculos()
  atualizarSelectsPlaca()
}

// =================== MANUTENÇÕES ===================

function renderManutencoes(lista) {
  if (!lista) lista = manutencoes
  atualizarSelectContratos('filtro-contrato-man', veiculos)
  document.getElementById('tbody-man').innerHTML = lista.length
    ? lista.map(m => {
        const vei = veiculos.find(v => v.id === m.veiculo_id)
        return `<tr>
          <td><span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#555c72">${m.numero || '—'}</span></td>
          <td><span class="placa">${vei?.placa || m.placa || '—'}</span></td>
          <td style="color:#8b90a0">${labelTipoMan(m.tipo)}</td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${m.descricao||''}">${m.descricao || '—'}</td>
          <td style="color:#8b90a0">${vei?.contrato || '—'}</td>
          <td style="color:#8b90a0;font-family:'JetBrains Mono',monospace;font-size:12px">${m.hodometro ? m.hodometro.toLocaleString('pt-BR') + ' km' : '—'}</td>
          <td><span class="badge badge-${m.status}">${labelStatus(m.status)}</span></td>
          <td style="color:#8b90a0">${m.data_prevista ? formatarData(m.data_prevista) : '—'}</td>
          <td style="white-space:nowrap">
            <button class="btn-icon" onclick="editarMan('${m.id}')">✏</button>
            <button class="btn-icon danger" onclick="excluirMan('${m.id}')" style="margin-left:4px">🗑</button>
          </td>
        </tr>`
      }).join('')
    : '<tr><td colspan="9"><div class="empty-state">Nenhuma manutenção encontrada.</div></td></tr>'
}

function filtrarMan() {
  const busca = document.getElementById('busca-man').value.toLowerCase()
  const tipo = document.getElementById('filtro-tipo-man').value
  const status = document.getElementById('filtro-status-man').value
  const contrato = document.getElementById('filtro-contrato-man').value
  renderManutencoes(manutencoes.filter(m => {
    const vei = veiculos.find(v => v.id === m.veiculo_id)
    return (!busca || (vei?.placa||'').toLowerCase().includes(busca) || (m.descricao||'').toLowerCase().includes(busca)) &&
      (!tipo || m.tipo === tipo) && (!status || m.status === status) &&
      (!contrato || vei?.contrato === contrato)
  }))
}

function abrirModalMan(man) {
  atualizarSelectsPlaca()
  document.getElementById('modal-man-titulo').textContent = man ? 'Editar manutenção' : 'Nova manutenção'
  document.getElementById('man-edit-id').value = man?.id || ''
  document.getElementById('man-placa').value = man?.veiculo_id || ''
  document.getElementById('man-tipo').value = man?.tipo || ''
  document.getElementById('man-status').value = man?.status || 'pendente'
  document.getElementById('man-hodometro').value = man?.hodometro || ''
  document.getElementById('man-data').value = man?.data_prevista || ''
  document.getElementById('man-custo').value = man?.custo || ''
  document.getElementById('man-responsavel').value = man?.responsavel || ''
  document.getElementById('man-descricao').value = man?.descricao || ''
  document.getElementById('man-form-error').style.display = 'none'
  document.getElementById('modal-man').style.display = 'flex'
}

function fecharModalMan(e) {
  if (e && e.target !== document.getElementById('modal-man')) return
  document.getElementById('modal-man').style.display = 'none'
}

async function salvarMan() {
  const id = document.getElementById('man-edit-id').value
  const veiculoId = document.getElementById('man-placa').value
  const tipo = document.getElementById('man-tipo').value
  const desc = document.getElementById('man-descricao').value.trim()
  const err = document.getElementById('man-form-error')
  err.style.display = 'none'
  if (!veiculoId || !tipo || !desc) { err.textContent = 'Placa, tipo e descrição são obrigatórios.'; err.style.display = 'block'; return }

  const payload = {
    veiculo_id: veiculoId, tipo,
    status: document.getElementById('man-status').value,
    hodometro: parseInt(document.getElementById('man-hodometro').value) || null,
    data_prevista: document.getElementById('man-data').value || null,
    custo: parseFloat(document.getElementById('man-custo').value) || null,
    responsavel: document.getElementById('man-responsavel').value.trim() || null,
    descricao: desc,
    user_id: usuarioAtual.id,
  }

  const { error } = id
    ? await db.from('manutencoes').update(payload).eq('id', id)
    : await db.from('manutencoes').insert({ ...payload, numero: gerarNumero(), criado_em: new Date().toISOString() })

  if (error) { err.textContent = 'Erro: ' + error.message; err.style.display = 'block'; return }
  document.getElementById('modal-man').style.display = 'none'
  toast(id ? 'Manutenção atualizada.' : 'Manutenção registrada.')
  await carregarManutencoes()
  renderManutencoes()
  renderDashboard()
}

function editarMan(id) { abrirModalMan(manutencoes.find(m => m.id === id)) }

async function excluirMan(id) {
  if (!confirm('Excluir esta manutenção?')) return
  const { error } = await db.from('manutencoes').delete().eq('id', id)
  if (error) { toast('Erro: ' + error.message); return }
  toast('Manutenção excluída.')
  await carregarManutencoes()
  renderManutencoes()
  renderDashboard()
}

function gerarNumero() {
  const nums = manutencoes.map(m => parseInt((m.numero || '').replace('OS-','')) || 0)
  return 'OS-' + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(4, '0')
}

// =================== DOCUMENTOS ===================

function renderDocumentos(lista) {
  if (!lista) lista = documentos
  atualizarSelectContratos('filtro-contrato-doc', veiculos)
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const em30 = new Date(hoje); em30.setDate(em30.getDate() + 30)
  document.getElementById('tbody-doc').innerHTML = lista.length
    ? lista.map(d => {
        const vei = veiculos.find(v => v.id === d.veiculo_id)
        const venc = new Date(d.vencimento)
        const sit = venc < hoje ? 'vencido' : venc <= em30 ? 'avencer' : 'ok'
        const sitLabel = { vencido: 'Vencido', avencer: 'A vencer', ok: 'Em dia' }[sit]
        return `<tr>
          <td><span class="placa">${vei?.placa || '—'}</span></td>
          <td style="color:#8b90a0">${labelDoc(d.tipo)}</td>
          <td>${d.descricao || '—'}</td>
          <td style="color:#8b90a0">${vei?.contrato || '—'}</td>
          <td style="font-family:'JetBrains Mono',monospace;font-size:12px">${formatarData(d.vencimento)}</td>
          <td><span class="badge badge-${sit}">${sitLabel}</span></td>
          <td style="white-space:nowrap">
            <button class="btn-icon" onclick="editarDoc('${d.id}')">✏</button>
            <button class="btn-icon danger" onclick="excluirDoc('${d.id}')" style="margin-left:4px">🗑</button>
          </td>
        </tr>`
      }).join('')
    : '<tr><td colspan="7"><div class="empty-state">Nenhum documento cadastrado.</div></td></tr>'
}

function filtrarDoc() {
  const busca = document.getElementById('busca-doc').value.toLowerCase()
  const tipo = document.getElementById('filtro-tipo-doc').value
  const contrato = document.getElementById('filtro-contrato-doc').value
  renderDocumentos(documentos.filter(d => {
    const vei = veiculos.find(v => v.id === d.veiculo_id)
    return (!busca || (vei?.placa||'').toLowerCase().includes(busca)) &&
      (!tipo || d.tipo === tipo) && (!contrato || vei?.contrato === contrato)
  }))
}

function abrirModalDoc(doc) {
  atualizarSelectsPlaca()
  document.getElementById('modal-doc-titulo').textContent = doc ? 'Editar documento' : 'Novo documento'
  document.getElementById('doc-edit-id').value = doc?.id || ''
  document.getElementById('doc-placa').value = doc?.veiculo_id || ''
  document.getElementById('doc-tipo').value = doc?.tipo || ''
  document.getElementById('doc-descricao').value = doc?.descricao || ''
  document.getElementById('doc-vencimento').value = doc?.vencimento || ''
  document.getElementById('doc-valor').value = doc?.valor || ''
  document.getElementById('doc-numero').value = doc?.numero_doc || ''
  document.getElementById('doc-obs').value = doc?.observacoes || ''
  document.getElementById('doc-form-error').style.display = 'none'
  document.getElementById('modal-doc').style.display = 'flex'
}

function fecharModalDoc(e) {
  if (e && e.target !== document.getElementById('modal-doc')) return
  document.getElementById('modal-doc').style.display = 'none'
}

async function salvarDoc() {
  const id = document.getElementById('doc-edit-id').value
  const veiculoId = document.getElementById('doc-placa').value
  const tipo = document.getElementById('doc-tipo').value
  const vencimento = document.getElementById('doc-vencimento').value
  const err = document.getElementById('doc-form-error')
  err.style.display = 'none'
  if (!veiculoId || !tipo || !vencimento) { err.textContent = 'Placa, tipo e vencimento são obrigatórios.'; err.style.display = 'block'; return }

  const payload = {
    veiculo_id: veiculoId, tipo, vencimento,
    descricao: document.getElementById('doc-descricao').value.trim() || null,
    valor: parseFloat(document.getElementById('doc-valor').value) || null,
    numero_doc: document.getElementById('doc-numero').value.trim() || null,
    observacoes: document.getElementById('doc-obs').value.trim() || null,
    user_id: usuarioAtual.id,
  }

  const { error } = id
    ? await db.from('documentos').update(payload).eq('id', id)
    : await db.from('documentos').insert({ ...payload, criado_em: new Date().toISOString() })

  if (error) { err.textContent = 'Erro: ' + error.message; err.style.display = 'block'; return }
  document.getElementById('modal-doc').style.display = 'none'
  toast(id ? 'Documento atualizado.' : 'Documento cadastrado.')
  await carregarDocumentos()
  renderDocumentos()
  renderDashboard()
}

function editarDoc(id) { abrirModalDoc(documentos.find(d => d.id === id)) }

async function excluirDoc(id) {
  if (!confirm('Excluir este documento?')) return
  const { error } = await db.from('documentos').delete().eq('id', id)
  if (error) { toast('Erro: ' + error.message); return }
  toast('Documento excluído.')
  await carregarDocumentos()
  renderDocumentos()
  renderDashboard()
}

// =================== RELATÓRIOS ===================

function renderRelatorios() {
  const custoTotal = manutencoes.reduce((s, m) => s + (m.custo || 0), 0)
  const concluidas = manutencoes.filter(m => m.status === 'concluido').length
  const taxa = manutencoes.length ? Math.round((concluidas / manutencoes.length) * 100) : 0

  document.getElementById('kpi-relatorios').innerHTML = `
    <div class="kpi"><div class="kpi-label">Veículos</div><div class="kpi-val blue">${veiculos.length}</div></div>
    <div class="kpi"><div class="kpi-label">Total de OS</div><div class="kpi-val">${manutencoes.length}</div></div>
    <div class="kpi"><div class="kpi-label">Taxa conclusão</div><div class="kpi-val green">${taxa}%</div></div>
    <div class="kpi"><div class="kpi-label">Custo total (R$)</div><div class="kpi-val orange">${custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div></div>
  `

  const porContrato = {}
  manutencoes.forEach(m => {
    const vei = veiculos.find(v => v.id === m.veiculo_id)
    const c = vei?.contrato || 'Sem contrato'
    porContrato[c] = (porContrato[c] || 0) + 1
  })
  renderBarChart('chart-contrato', Object.entries(porContrato).map(([label, count]) => ({ label, count, color: '#3b82f6' })))

  const porStatusVei = { ativo: 0, manutencao: 0, inativo: 0 }
  veiculos.forEach(v => { if (porStatusVei[v.status] !== undefined) porStatusVei[v.status]++ })
  renderBarChart('chart-vei-status', [
    { label: 'Ativo', count: porStatusVei.ativo, color: '#22c55e' },
    { label: 'Manutenção', count: porStatusVei.manutencao, color: '#f59e0b' },
    { label: 'Inativo', count: porStatusVei.inativo, color: '#555c72' },
  ])

  document.getElementById('tbody-rel').innerHTML = manutencoes.length
    ? manutencoes.map(m => {
        const vei = veiculos.find(v => v.id === m.veiculo_id)
        return `<tr>
          <td><span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#555c72">${m.numero||'—'}</span></td>
          <td><span class="placa">${vei?.placa||'—'}</span></td>
          <td style="color:#8b90a0">${labelTipoMan(m.tipo)}</td>
          <td style="color:#8b90a0">${vei?.contrato||'—'}</td>
          <td style="color:#8b90a0;font-family:'JetBrains Mono',monospace;font-size:12px">${m.hodometro ? m.hodometro.toLocaleString('pt-BR') + ' km' : '—'}</td>
          <td><span class="badge badge-${m.status}">${labelStatus(m.status)}</span></td>
          <td style="color:#8b90a0">${m.data_prevista ? formatarData(m.data_prevista) : '—'}</td>
          <td style="color:#8b90a0">${m.custo ? 'R$ ' + m.custo.toLocaleString('pt-BR', {minimumFractionDigits:2}) : '—'}</td>
        </tr>`
      }).join('')
    : '<tr><td colspan="8"><div class="empty-state">Nenhuma manutenção registrada.</div></td></tr>'
}

function exportarCSV() {
  const cols = ['OS','Placa','Tipo','Contrato','Hodometro','Status','Data','Custo','Descricao']
  const linhas = manutencoes.map(m => {
    const vei = veiculos.find(v => v.id === m.veiculo_id)
    return [m.numero, vei?.placa||'', labelTipoMan(m.tipo), vei?.contrato||'', m.hodometro||'', m.status, m.data_prevista||'', m.custo||'', m.descricao||'']
      .map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')
  })
  const blob = new Blob(['\uFEFF' + [cols.join(','), ...linhas].join('\n')], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
  a.download = `frota_${new Date().toISOString().slice(0,10)}.csv`; a.click()
}

// =================== UTILS ===================

function atualizarSelectsPlaca() {
  ['man-placa', 'doc-placa'].forEach(id => {
    const sel = document.getElementById(id); if (!sel) return
    const atual = sel.value
    sel.innerHTML = '<option value="">Selecione a placa...</option>' +
      veiculos.map(v => `<option value="${v.id}">${v.placa} — ${v.modelo || ''} (${v.contrato || ''})</option>`).join('')
    if (veiculos.find(v => v.id === atual)) sel.value = atual
  })
}

function atualizarSelectContratos(id, lista) {
  const sel = document.getElementById(id); if (!sel) return
  const contratos = [...new Set(lista.map(v => v.contrato).filter(Boolean))].sort()
  const atual = sel.value
  sel.innerHTML = '<option value="">Todos os contratos</option>' + contratos.map(c => `<option value="${c}">${c}</option>`).join('')
  if (contratos.includes(atual)) sel.value = atual
}

function labelStatus(s) { return { pendente: 'Pendente', andamento: 'Em andamento', concluido: 'Concluído' }[s] || s }
function labelStatusVei(s) { return { ativo: 'Ativo', manutencao: 'Manutenção', inativo: 'Inativo' }[s] || s }
function labelTipoMan(t) { return { oleo: 'Óleo/Filtros', pneus: 'Pneus', revisao: 'Revisão', corretiva: 'Corretiva' }[t] || t || '—' }
function labelDoc(t) { return { ipva: 'IPVA', seguro: 'Seguro', vistoria: 'Vistoria', licenciamento: 'Licenciamento', outro: 'Outro' }[t] || t || '—' }
function formatarData(d) { if (!d) return '—'; const [y,m,day] = d.split('-'); return `${day}/${m}/${y}` }
function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.style.display = 'block'; setTimeout(() => t.style.display = 'none', 3000) }

verificarSessao()
