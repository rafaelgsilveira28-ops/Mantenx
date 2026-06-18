// Inicializa Supabase
const { createClient } = supabase
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

let usuarioAtual = null
let todasOS = []
let todosEquip = []

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
  const { data, error } = await db.auth.signUp({ email, password: senha, options: { data: { nome } } })
  if (error) { err.textContent = error.message; err.style.display = 'block'; return }
  usuarioAtual = data.user
  mostrarLogin()
  toast('Conta criada! Verifique seu e-mail e faça login.')
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
  if (session) {
    usuarioAtual = session.user
    iniciarApp()
  } else {
    document.getElementById('login-screen').style.display = 'flex'
  }
}

function iniciarApp() {
  document.getElementById('login-screen').style.display = 'none'
  document.getElementById('register-screen').style.display = 'none'
  document.getElementById('app').style.display = 'flex'
  const nome = usuarioAtual?.user_metadata?.nome || usuarioAtual?.email || '—'
  document.getElementById('user-name-sidebar').textContent = nome
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  document.getElementById('data-hoje').textContent = hoje.charAt(0).toUpperCase() + hoje.slice(1)
  carregarDados()
}

// =================== NAVEGAÇÃO ===================

function navegarPara(pagina, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'))
  document.getElementById('page-' + pagina).classList.add('active')
  if (el) el.classList.add('active')
  if (pagina === 'dashboard') renderDashboard()
  if (pagina === 'os') renderOS()
  if (pagina === 'equipamentos') renderEquip()
  if (pagina === 'relatorios') renderRelatorios()
}

// =================== DADOS ===================

async function carregarDados() {
  await Promise.all([carregarOS(), carregarEquip()])
  renderDashboard()
}

async function carregarOS() {
  const { data, error } = await db.from('ordens_servico').select('*').order('criado_em', { ascending: false })
  if (!error) todasOS = data || []
}

async function carregarEquip() {
  const { data, error } = await db.from('equipamentos').select('*').order('nome')
  if (!error) todosEquip = data || []
}

// =================== DASHBOARD ===================

function renderDashboard() {
  const total = todasOS.length
  const pendentes = todasOS.filter(o => o.status === 'pendente').length
  const andamento = todasOS.filter(o => o.status === 'andamento').length
  const concluidos = todasOS.filter(o => o.status === 'concluido').length
  const criticas = todasOS.filter(o => o.prioridade === 'critica' && o.status !== 'concluido').length

  document.getElementById('kpi-grid').innerHTML = `
    <div class="kpi"><div class="kpi-label">Total de OS</div><div class="kpi-val blue">${total}</div></div>
    <div class="kpi"><div class="kpi-label">Pendentes</div><div class="kpi-val yellow">${pendentes}</div></div>
    <div class="kpi"><div class="kpi-label">Em andamento</div><div class="kpi-val orange">${andamento}</div></div>
    <div class="kpi"><div class="kpi-label">Concluídas</div><div class="kpi-val green">${concluidos}</div></div>
    <div class="kpi"><div class="kpi-label">Críticas abertas</div><div class="kpi-val red">${criticas}</div></div>
  `

  renderBarChart('chart-status', [
    { label: 'Pendente', count: pendentes, color: '#f59e0b' },
    { label: 'Andamento', count: andamento, color: '#f97316' },
    { label: 'Concluído', count: concluidos, color: '#22c55e' },
  ])

  const pri = { critica: 0, alta: 0, media: 0, baixa: 0 }
  todasOS.forEach(o => { if (pri[o.prioridade] !== undefined) pri[o.prioridade]++ })
  renderBarChart('chart-prioridade', [
    { label: 'Crítica', count: pri.critica, color: '#ef4444' },
    { label: 'Alta', count: pri.alta, color: '#f97316' },
    { label: 'Média', count: pri.media, color: '#8b90a0' },
    { label: 'Baixa', count: pri.baixa, color: '#22c55e' },
  ])

  const recentes = todasOS.slice(0, 8)
  const tbody = recentes.map(o => `
    <tr>
      <td><span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#555c72">${o.numero}</span></td>
      <td>${o.equipamento}</td>
      <td><span class="badge badge-${o.prioridade}">${labelPrioridade(o.prioridade)}</span></td>
      <td><span class="badge badge-${o.status}">${labelStatus(o.status)}</span></td>
      <td style="color:#8b90a0">${o.unidade || '—'}</td>
      <td style="color:#8b90a0">${o.data_prevista ? formatarData(o.data_prevista) : '—'}</td>
    </tr>
  `).join('')

  document.getElementById('tabela-recentes').innerHTML = `
    <thead><tr><th>OS</th><th>Equipamento</th><th>Prioridade</th><th>Status</th><th>Unidade</th><th>Data prevista</th></tr></thead>
    <tbody>${tbody || '<tr><td colspan="6"><div class="empty-state">Nenhuma OS cadastrada ainda.</div></td></tr>'}</tbody>
  `
}

function renderBarChart(id, items) {
  const max = Math.max(...items.map(i => i.count), 1)
  document.getElementById(id).innerHTML = items.map(i => `
    <div class="bar-row">
      <span class="bar-label">${i.label}</span>
      <div class="bar-track">
        <div class="bar-fill" style="width:${Math.round((i.count / max) * 100)}%;background:${i.color}"></div>
      </div>
      <span class="bar-count">${i.count}</span>
    </div>
  `).join('')
}

// =================== OS ===================

function renderOS(lista) {
  if (!lista) lista = todasOS
  atualizarSelectUnidades('filtro-unidade-os', lista)

  if (!lista.length) {
    document.getElementById('tbody-os').innerHTML = '<tr><td colspan="9"><div class="empty-state">Nenhuma OS encontrada. Crie a primeira clicando em "+ Nova OS".</div></td></tr>'
    return
  }

  document.getElementById('tbody-os').innerHTML = lista.map(o => `
    <tr>
      <td><span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#555c72">${o.numero}</span></td>
      <td>
        <span style="font-weight:500">${o.equipamento}</span>
        ${o.descricao ? `<br><span style="font-size:11px;color:#555c72">${o.descricao.substring(0, 50)}${o.descricao.length > 50 ? '…' : ''}</span>` : ''}
      </td>
      <td style="color:#8b90a0">${o.tipo || '—'}</td>
      <td><span class="badge badge-${o.prioridade}">${labelPrioridade(o.prioridade)}</span></td>
      <td><span class="badge badge-${o.status}">${labelStatus(o.status)}</span></td>
      <td style="color:#8b90a0">${o.unidade || '—'}</td>
      <td style="color:#8b90a0">${o.responsavel || '—'}</td>
      <td style="color:#8b90a0">${o.data_prevista ? formatarData(o.data_prevista) : '—'}</td>
      <td style="white-space:nowrap">
        <button class="btn-icon" onclick="editarOS('${o.id}')" title="Editar">✏</button>
        <button class="btn-icon danger" onclick="excluirOS('${o.id}')" title="Excluir" style="margin-left:4px">🗑</button>
      </td>
    </tr>
  `).join('')
}

function filtrarOS() {
  const busca = document.getElementById('busca-os').value.toLowerCase()
  const status = document.getElementById('filtro-status').value
  const prioridade = document.getElementById('filtro-prioridade').value
  const unidade = document.getElementById('filtro-unidade-os').value

  const filtrado = todasOS.filter(o => {
    const matchBusca = !busca || o.equipamento.toLowerCase().includes(busca) || (o.descricao || '').toLowerCase().includes(busca)
    const matchStatus = !status || o.status === status
    const matchPrioridade = !prioridade || o.prioridade === prioridade
    const matchUnidade = !unidade || o.unidade === unidade
    return matchBusca && matchStatus && matchPrioridade && matchUnidade
  })
  renderOS(filtrado)
}

function abrirModalOS(os) {
  document.getElementById('modal-os-titulo').textContent = os ? 'Editar OS' : 'Nova ordem de serviço'
  document.getElementById('os-edit-id').value = os?.id || ''
  document.getElementById('os-equip').value = os?.equipamento || ''
  document.getElementById('os-unidade').value = os?.unidade || ''
  document.getElementById('os-tipo').value = os?.tipo || ''
  document.getElementById('os-prioridade').value = os?.prioridade || ''
  document.getElementById('os-responsavel').value = os?.responsavel || ''
  document.getElementById('os-data').value = os?.data_prevista || ''
  document.getElementById('os-custo').value = os?.custo_estimado || ''
  document.getElementById('os-status').value = os?.status || 'pendente'
  document.getElementById('os-descricao').value = os?.descricao || ''
  document.getElementById('os-form-error').style.display = 'none'
  document.getElementById('modal-os').style.display = 'flex'
}

function fecharModalOS(e) {
  if (e && e.target !== document.getElementById('modal-os')) return
  document.getElementById('modal-os').style.display = 'none'
}

async function salvarOS() {
  const id = document.getElementById('os-edit-id').value
  const equip = document.getElementById('os-equip').value.trim()
  const unidade = document.getElementById('os-unidade').value.trim()
  const tipo = document.getElementById('os-tipo').value
  const prioridade = document.getElementById('os-prioridade').value
  const desc = document.getElementById('os-descricao').value.trim()
  const err = document.getElementById('os-form-error')
  err.style.display = 'none'
  if (!equip || !unidade || !tipo || !prioridade || !desc) {
    err.textContent = 'Preencha todos os campos obrigatórios (*).'
    err.style.display = 'block'
    return
  }

  const payload = {
    equipamento: equip,
    unidade,
    tipo,
    prioridade,
    responsavel: document.getElementById('os-responsavel').value.trim() || null,
    data_prevista: document.getElementById('os-data').value || null,
    custo_estimado: parseFloat(document.getElementById('os-custo').value) || null,
    status: document.getElementById('os-status').value,
    descricao: desc,
    user_id: usuarioAtual.id,
  }

  let error
  if (id) {
    const res = await db.from('ordens_servico').update(payload).eq('id', id)
    error = res.error
  } else {
    payload.numero = gerarNumeroOS()
    payload.criado_em = new Date().toISOString()
    const res = await db.from('ordens_servico').insert(payload)
    error = res.error
  }

  if (error) { err.textContent = 'Erro ao salvar: ' + error.message; err.style.display = 'block'; return }

  document.getElementById('modal-os').style.display = 'none'
  toast(id ? 'OS atualizada com sucesso.' : 'OS criada com sucesso.')
  await carregarOS()
  renderOS()
  renderDashboard()
}

async function editarOS(id) {
  const os = todasOS.find(o => o.id === id)
  if (os) abrirModalOS(os)
}

async function excluirOS(id) {
  if (!confirm('Excluir esta OS permanentemente?')) return
  const { error } = await db.from('ordens_servico').delete().eq('id', id)
  if (error) { toast('Erro ao excluir: ' + error.message); return }
  toast('OS excluída.')
  await carregarOS()
  renderOS()
  renderDashboard()
}

function gerarNumeroOS() {
  const nums = todasOS.map(o => parseInt((o.numero || '').replace('OS-', '')) || 0)
  const max = nums.length ? Math.max(...nums) : 0
  return 'OS-' + String(max + 1).padStart(4, '0')
}

// =================== EQUIPAMENTOS ===================

function renderEquip(lista) {
  if (!lista) lista = todosEquip
  atualizarSelectUnidades('filtro-unidade-equip', lista.map(e => ({ unidade: e.unidade })))

  const grid = document.getElementById('equip-grid')
  if (!lista.length) {
    grid.innerHTML = '<div class="empty-state"><p>Nenhum equipamento cadastrado.</p><p>Clique em "+ Novo equipamento" para começar.</p></div>'
    return
  }
  grid.innerHTML = lista.map(e => `
    <div class="equip-card">
      <div class="equip-card-header">
        <div>
          <div class="equip-card-name">${e.nome}</div>
          <div class="equip-card-code">${e.codigo || '—'}</div>
        </div>
        <span class="badge badge-${e.status}">${labelStatusEquip(e.status)}</span>
      </div>
      <div class="equip-meta">
        <div class="equip-meta-row"><span class="equip-meta-key">Unidade</span><span class="equip-meta-val">${e.unidade || '—'}</span></div>
        <div class="equip-meta-row"><span class="equip-meta-key">Local</span><span class="equip-meta-val">${e.localizacao || '—'}</span></div>
        <div class="equip-meta-row"><span class="equip-meta-key">Fabricante</span><span class="equip-meta-val">${e.fabricante || '—'}</span></div>
        <div class="equip-meta-row"><span class="equip-meta-key">Série</span><span class="equip-meta-val" style="font-family:'JetBrains Mono',monospace;font-size:11px">${e.numero_serie || '—'}</span></div>
        ${e.ano_instalacao ? `<div class="equip-meta-row"><span class="equip-meta-key">Ano</span><span class="equip-meta-val">${e.ano_instalacao}</span></div>` : ''}
      </div>
      <div class="equip-actions">
        <button class="btn-icon" onclick="editarEquip('${e.id}')">✏ Editar</button>
        <button class="btn-icon danger" onclick="excluirEquip('${e.id}')">🗑</button>
      </div>
    </div>
  `).join('')
}

function filtrarEquip() {
  const busca = document.getElementById('busca-equip').value.toLowerCase()
  const unidade = document.getElementById('filtro-unidade-equip').value
  const filtrado = todosEquip.filter(e => {
    const matchBusca = !busca || e.nome.toLowerCase().includes(busca) || (e.codigo || '').toLowerCase().includes(busca)
    const matchUnidade = !unidade || e.unidade === unidade
    return matchBusca && matchUnidade
  })
  renderEquip(filtrado)
}

function abrirModalEquip(equip) {
  document.getElementById('modal-equip-titulo').textContent = equip ? 'Editar equipamento' : 'Novo equipamento'
  document.getElementById('equip-edit-id').value = equip?.id || ''
  document.getElementById('equip-nome').value = equip?.nome || ''
  document.getElementById('equip-codigo').value = equip?.codigo || ''
  document.getElementById('equip-unidade').value = equip?.unidade || ''
  document.getElementById('equip-local').value = equip?.localizacao || ''
  document.getElementById('equip-fabricante').value = equip?.fabricante || ''
  document.getElementById('equip-serie').value = equip?.numero_serie || ''
  document.getElementById('equip-ano').value = equip?.ano_instalacao || ''
  document.getElementById('equip-status').value = equip?.status || 'operando'
  document.getElementById('equip-obs').value = equip?.observacoes || ''
  document.getElementById('equip-form-error').style.display = 'none'
  document.getElementById('modal-equip').style.display = 'flex'
}

function fecharModalEquip(e) {
  if (e && e.target !== document.getElementById('modal-equip')) return
  document.getElementById('modal-equip').style.display = 'none'
}

async function salvarEquip() {
  const id = document.getElementById('equip-edit-id').value
  const nome = document.getElementById('equip-nome').value.trim()
  const unidade = document.getElementById('equip-unidade').value.trim()
  const err = document.getElementById('equip-form-error')
  err.style.display = 'none'
  if (!nome || !unidade) { err.textContent = 'Nome e unidade são obrigatórios.'; err.style.display = 'block'; return }

  const payload = {
    nome,
    codigo: document.getElementById('equip-codigo').value.trim() || null,
    unidade,
    localizacao: document.getElementById('equip-local').value.trim() || null,
    fabricante: document.getElementById('equip-fabricante').value.trim() || null,
    numero_serie: document.getElementById('equip-serie').value.trim() || null,
    ano_instalacao: parseInt(document.getElementById('equip-ano').value) || null,
    status: document.getElementById('equip-status').value,
    observacoes: document.getElementById('equip-obs').value.trim() || null,
    user_id: usuarioAtual.id,
  }

  let error
  if (id) {
    const res = await db.from('equipamentos').update(payload).eq('id', id)
    error = res.error
  } else {
    payload.criado_em = new Date().toISOString()
    const res = await db.from('equipamentos').insert(payload)
    error = res.error
  }

  if (error) { err.textContent = 'Erro ao salvar: ' + error.message; err.style.display = 'block'; return }

  document.getElementById('modal-equip').style.display = 'none'
  toast(id ? 'Equipamento atualizado.' : 'Equipamento cadastrado.')
  await carregarEquip()
  renderEquip()
}

async function editarEquip(id) {
  const e = todosEquip.find(eq => eq.id === id)
  if (e) abrirModalEquip(e)
}

async function excluirEquip(id) {
  if (!confirm('Excluir este equipamento?')) return
  const { error } = await db.from('equipamentos').delete().eq('id', id)
  if (error) { toast('Erro: ' + error.message); return }
  toast('Equipamento excluído.')
  await carregarEquip()
  renderEquip()
}

// =================== RELATÓRIOS ===================

function renderRelatorios() {
  const concluidas = todasOS.filter(o => o.status === 'concluido')
  const taxaConclusao = todasOS.length ? Math.round((concluidas.length / todasOS.length) * 100) : 0
  const custoTotal = todasOS.reduce((s, o) => s + (o.custo_estimado || 0), 0)

  document.getElementById('kpi-relatorios').innerHTML = `
    <div class="kpi"><div class="kpi-label">Total de OS</div><div class="kpi-val blue">${todasOS.length}</div></div>
    <div class="kpi"><div class="kpi-label">Taxa de conclusão</div><div class="kpi-val green">${taxaConclusao}%</div></div>
    <div class="kpi"><div class="kpi-label">Custo estimado total</div><div class="kpi-val orange">R$ ${custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div></div>
    <div class="kpi"><div class="kpi-label">Equipamentos</div><div class="kpi-val">${todosEquip.length}</div></div>
  `

  // OS por unidade
  const porUnidade = {}
  todasOS.forEach(o => { const u = o.unidade || 'Sem unidade'; porUnidade[u] = (porUnidade[u] || 0) + 1 })
  renderBarChart('chart-unidade', Object.entries(porUnidade).map(([label, count]) => ({ label, count, color: '#3b82f6' })))

  // OS por tipo
  const porTipo = {}
  todasOS.forEach(o => { const t = o.tipo || 'Não definido'; porTipo[t] = (porTipo[t] || 0) + 1 })
  const cores = { Corretiva: '#ef4444', Preventiva: '#22c55e', Preditiva: '#3b82f6', Melhoria: '#f59e0b' }
  renderBarChart('chart-tipo', Object.entries(porTipo).map(([label, count]) => ({ label, count, color: cores[label] || '#8b90a0' })))

  // Tabela de concluídas
  document.getElementById('tbody-concluidas').innerHTML = concluidas.length
    ? concluidas.map(o => `
        <tr>
          <td><span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#555c72">${o.numero}</span></td>
          <td>${o.equipamento}</td>
          <td style="color:#8b90a0">${o.tipo || '—'}</td>
          <td style="color:#8b90a0">${o.unidade || '—'}</td>
          <td style="color:#8b90a0">${o.responsavel || '—'}</td>
          <td style="color:#8b90a0">${o.data_prevista ? formatarData(o.data_prevista) : '—'}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="6"><div class="empty-state">Nenhuma OS concluída ainda.</div></td></tr>'
}

function exportarCSV() {
  const cols = ['Numero', 'Equipamento', 'Tipo', 'Prioridade', 'Status', 'Unidade', 'Responsavel', 'Data Prevista', 'Custo Estimado', 'Descricao']
  const linhas = todasOS.map(o => [
    o.numero, o.equipamento, o.tipo, o.prioridade, o.status,
    o.unidade, o.responsavel, o.data_prevista, o.custo_estimado, o.descricao
  ].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','))
  const csv = [cols.join(','), ...linhas].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `os_manutencao_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// =================== UTILS ===================

function atualizarSelectUnidades(id, lista) {
  const sel = document.getElementById(id)
  if (!sel) return
  const unidades = [...new Set((lista || todasOS).map(o => o.unidade).filter(Boolean))].sort()
  const atual = sel.value
  sel.innerHTML = '<option value="">Todas as unidades</option>' + unidades.map(u => `<option value="${u}">${u}</option>`).join('')
  if (unidades.includes(atual)) sel.value = atual
}

function labelStatus(s) {
  return { pendente: 'Pendente', andamento: 'Em andamento', concluido: 'Concluído' }[s] || s
}

function labelPrioridade(p) {
  return { critica: 'Crítica', alta: 'Alta', media: 'Média', baixa: 'Baixa' }[p] || p
}

function labelStatusEquip(s) {
  return { operando: 'Operando', manutencao: 'Manutenção', inativo: 'Inativo' }[s] || s
}

function formatarData(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function toast(msg) {
  const t = document.getElementById('toast')
  t.textContent = msg
  t.style.display = 'block'
  setTimeout(() => t.style.display = 'none', 3000)
}

// Inicializa
verificarSessao()
