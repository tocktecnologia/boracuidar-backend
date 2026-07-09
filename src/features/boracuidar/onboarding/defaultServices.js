export function getDefaultServicesByBusinessType(businessType, businessId) {
  switch (businessType) {
    case "BARBEARIA":
      return getDefaultServicesBarbearia(businessId);
    case "SALAO_BELEZA":
      return getDefaultServicesSalao(businessId);
    case "CLINICA":
      return getDefaultServicesClinica(businessId);
    case "ESTUDIO_ESTETICA":
      return getDefaultServicesEstetica(businessId);
    case "HOMECARE":
      return getDefaultServicesHomecare(businessId);
    case "PERSONAL":
      return getDefaultServicesPersonal(businessId);
    case "SERVICOS_GERAIS":
    case "SERVICO_PERSONALIZADO":
      return getDefaultServicesGerais(businessId);
    case "PETSHOPS_VETERINARIO":
      return getDefaultServicesPet(businessId);
    case "SURF":
      return getDefaultServicesSurf(businessId);
    default:
      return [];
  }
}

function getDefaultServicesBarbearia(businessId) {
  return [
    { nome: "Corte", duracao_minutos: 40, preco: 30.0, descricao: "Corte de cabelo masculino", ativo: true, business_id: businessId },
    { nome: "Barba", duracao_minutos: 20, preco: 25.0, descricao: "Barba completa", ativo: true, business_id: businessId },
    { nome: "Corte + barba + sobrancelha", duracao_minutos: 75, preco: 60.0, descricao: "Pacote completo: corte, barba e sobrancelha", ativo: true, business_id: businessId },
    { nome: "Corte + sobrancelha", duracao_minutos: 55, preco: 40.0, descricao: "Corte de cabelo e sobrancelha", ativo: true, business_id: businessId },
    { nome: "Corte + selagem", duracao_minutos: 90, preco: 100.0, descricao: "Corte de cabelo com selagem", ativo: true, business_id: businessId },
    { nome: "Corte + barba", duracao_minutos: 60, preco: 55.0, descricao: "Corte de cabelo e barba", ativo: true, business_id: businessId },
    { nome: "Corte + platinado", duracao_minutos: 120, preco: 110.0, descricao: "Corte de cabelo com platinado", ativo: true, business_id: businessId },
    { nome: "Barba + sobrancelha", duracao_minutos: 35, preco: 30.0, descricao: "Barba e sobrancelha", ativo: true, business_id: businessId },
    { nome: "Corte + hidratação", duracao_minutos: 70, preco: 40.0, descricao: "Corte de cabelo com hidratação", ativo: true, business_id: businessId },
    { nome: "Corte infantil", duracao_minutos: 30, preco: 30.0, descricao: "Corte de cabelo infantil", ativo: true, business_id: businessId },
    { nome: "Corte + luzes", duracao_minutos: 120, preco: 100.0, descricao: "Corte de cabelo com luzes", ativo: true, business_id: businessId },
    { nome: "Barbo terapia", duracao_minutos: 40, preco: 30.0, descricao: "Tratamento completo para barba", ativo: true, business_id: businessId }
  ];
}

function getDefaultServicesSalao(businessId) {
  return [
    { nome: "Corte feminino", duracao_minutos: 60, preco: 50.0, descricao: "Corte de cabelo feminino", ativo: true, business_id: businessId },
    { nome: "Escova", duracao_minutos: 45, preco: 40.0, descricao: "Escova modeladora", ativo: true, business_id: businessId },
    { nome: "Hidratação", duracao_minutos: 60, preco: 60.0, descricao: "Hidratação capilar", ativo: true, business_id: businessId },
    { nome: "Coloração", duracao_minutos: 120, preco: 150.0, descricao: "Coloração completa", ativo: true, business_id: businessId },
    { nome: "Mechas", duracao_minutos: 180, preco: 200.0, descricao: "Aplicação de mechas", ativo: true, business_id: businessId },
    { nome: "Progressiva", duracao_minutos: 180, preco: 250.0, descricao: "Escova progressiva", ativo: true, business_id: businessId },
    { nome: "Manicure", duracao_minutos: 45, preco: 35.0, descricao: "Manicure completa", ativo: true, business_id: businessId },
    { nome: "Pedicure", duracao_minutos: 50, preco: 40.0, descricao: "Pedicure completa", ativo: true, business_id: businessId },
    { nome: "Maquiagem", duracao_minutos: 60, preco: 80.0, descricao: "Maquiagem profissional", ativo: true, business_id: businessId },
    { nome: "Penteado", duracao_minutos: 90, preco: 100.0, descricao: "Penteado para eventos", ativo: true, business_id: businessId },
    { nome: "Design de sobrancelhas", duracao_minutos: 30, preco: 30.0, descricao: "Design e modelagem de sobrancelhas", ativo: true, business_id: businessId },
    { nome: "Botox capilar", duracao_minutos: 120, preco: 180.0, descricao: "Tratamento de botox capilar", ativo: true, business_id: businessId }
  ];
}

function getDefaultServicesClinica(businessId) {
  return [
    { nome: "Consulta geral", duracao_minutos: 30, preco: 150.0, descricao: "Consulta médica geral", ativo: true, business_id: businessId },
    { nome: "Consulta especializada", duracao_minutos: 45, preco: 250.0, descricao: "Consulta com especialista", ativo: true, business_id: businessId },
    { nome: "Exames laboratoriais", duracao_minutos: 15, preco: 100.0, descricao: "Coleta de exames laboratoriais", ativo: true, business_id: businessId },
    { nome: "Ultrassom", duracao_minutos: 30, preco: 200.0, descricao: "Exame de ultrassom", ativo: true, business_id: businessId },
    { nome: "Eletrocardiograma", duracao_minutos: 20, preco: 80.0, descricao: "Exame de eletrocardiograma", ativo: true, business_id: businessId },
    { nome: "Fisioterapia", duracao_minutos: 60, preco: 120.0, descricao: "Sessão de fisioterapia", ativo: true, business_id: businessId },
    { nome: "Retorno", duracao_minutos: 20, preco: 80.0, descricao: "Consulta de retorno", ativo: true, business_id: businessId },
    { nome: "Pequenos procedimentos", duracao_minutos: 45, preco: 300.0, descricao: "Procedimentos ambulatoriais simples", ativo: true, business_id: businessId }
  ];
}

function getDefaultServicesEstetica(businessId) {
  return [
    { nome: "Limpeza de pele", duracao_minutos: 90, preco: 120.0, descricao: "Limpeza de pele profunda", ativo: true, business_id: businessId },
    { nome: "Drenagem linfática", duracao_minutos: 60, preco: 100.0, descricao: "Drenagem linfática corporal", ativo: true, business_id: businessId },
    { nome: "Massagem modeladora", duracao_minutos: 60, preco: 110.0, descricao: "Massagem modeladora corporal", ativo: true, business_id: businessId },
    { nome: "Depilação completa", duracao_minutos: 90, preco: 150.0, descricao: "Depilação corpo completo", ativo: true, business_id: businessId },
    { nome: "Peeling", duracao_minutos: 60, preco: 150.0, descricao: "Peeling facial", ativo: true, business_id: businessId },
    { nome: "Microagulhamento", duracao_minutos: 90, preco: 250.0, descricao: "Microagulhamento facial", ativo: true, business_id: businessId },
    { nome: "Tratamento acne", duracao_minutos: 75, preco: 180.0, descricao: "Tratamento para acne", ativo: true, business_id: businessId },
    { nome: "Radiofrequência", duracao_minutos: 60, preco: 200.0, descricao: "Radiofrequência facial ou corporal", ativo: true, business_id: businessId },
    { nome: "Criolipólise", duracao_minutos: 60, preco: 400.0, descricao: "Criolipólise (1 aplicador)", ativo: true, business_id: businessId },
    { nome: "Design de sobrancelhas", duracao_minutos: 30, preco: 50.0, descricao: "Design e modelagem de sobrancelhas", ativo: true, business_id: businessId },
    { nome: "Extensão de cílios", duracao_minutos: 120, preco: 150.0, descricao: "Aplicação de extensão de cílios", ativo: true, business_id: businessId }
  ];
}

function getDefaultServicesHomecare(businessId) {
  return [
    { nome: "Atendimento domiciliar", duracao_minutos: 60, preco: 200.0, descricao: "Atendimento profissional em domicílio", ativo: true, business_id: businessId },
    { nome: "Curativos", duracao_minutos: 30, preco: 80.0, descricao: "Realização de curativos", ativo: true, business_id: businessId },
    { nome: "Aplicação de medicamentos", duracao_minutos: 20, preco: 60.0, descricao: "Aplicação de medicamentos injetáveis", ativo: true, business_id: businessId },
    { nome: "Aferição de sinais vitais", duracao_minutos: 15, preco: 50.0, descricao: "Descrição de pressão, temperatura e outros", ativo: true, business_id: businessId },
    { nome: "Coleta de exames", duracao_minutos: 30, preco: 120.0, descricao: "Coleta domiciliar de exames", ativo: true, business_id: businessId },
    { nome: "Fisioterapia domiciliar", duracao_minutos: 60, preco: 150.0, descricao: "Sessão de fisioterapia em casa", ativo: true, business_id: businessId },
    { nome: "Cuidados com idosos", duracao_minutos: 240, preco: 300.0, descricao: "Plantão de cuidados (4 horas)", ativo: true, business_id: businessId }
  ];
}

function getDefaultServicesPersonal(businessId) {
  return [
    { nome: "Treino personalizado", duracao_minutos: 60, preco: 100.0, descricao: "Sessão individual de treino", ativo: true, business_id: businessId },
    { nome: "Avaliação Física", duracao_minutos: 45, preco: 80.0, descricao: "Avaliação Física completa", ativo: true, business_id: businessId },
    { nome: "Treino em dupla", duracao_minutos: 60, preco: 150.0, descricao: "Sessão de treino para 2 pessoas", ativo: true, business_id: businessId },
    { nome: "Consultoria nutricional", duracao_minutos: 60, preco: 120.0, descricao: "Consultoria e planejamento nutricional", ativo: true, business_id: businessId },
    { nome: "Treino funcional", duracao_minutos: 60, preco: 90.0, descricao: "Treino funcional personalizado", ativo: true, business_id: businessId },
    { nome: "Pilates personalizado", duracao_minutos: 60, preco: 110.0, descricao: "Sessão individual de pilates", ativo: true, business_id: businessId },
    { nome: "Treino outdoor", duracao_minutos: 60, preco: 95.0, descricao: "Treino ao ar livre", ativo: true, business_id: businessId },
    { nome: "Pacote mensal (12 sessões)", duracao_minutos: 60, preco: 1000.0, descricao: "Pacote mensal com 12 sessões", ativo: true, business_id: businessId }
  ];
}

function getDefaultServicesGerais(businessId) {
  return [
    { nome: "Outros", duracao_minutos: 60, preco: 0.0, descricao: "Serviços com valores a combinar", ativo: true, business_id: businessId },
    { nome: "Consulta/Atendimento", duracao_minutos: 30, preco: 80.0, descricao: "Consulta ou atendimento geral", ativo: true, business_id: businessId },
    { nome: "Avaliação", duracao_minutos: 45, preco: 100.0, descricao: "Avaliação Técnica", ativo: true, business_id: businessId }
  ];
}

function getDefaultServicesPet(businessId) {
  return [
    { nome: "Banho (porte pequeno)", duracao_minutos: 45, preco: 50.0, descricao: "Banho para cães de porte pequeno", ativo: true, business_id: businessId },
    { nome: "Banho (porte médio)", duracao_minutos: 60, preco: 70.0, descricao: "Banho para cães de porte médio", ativo: true, business_id: businessId },
    { nome: "Banho (porte grande)", duracao_minutos: 90, preco: 90.0, descricao: "Banho para cães de porte grande", ativo: true, business_id: businessId },
    { nome: "Tosa higiênica", duracao_minutos: 30, preco: 40.0, descricao: "Tosa higiênica", ativo: true, business_id: businessId },
    { nome: "Tosa completa (pequeno)", duracao_minutos: 60, preco: 80.0, descricao: "Tosa completa para porte pequeno", ativo: true, business_id: businessId },
    { nome: "Tosa completa (médio)", duracao_minutos: 90, preco: 100.0, descricao: "Tosa completa para porte médio", ativo: true, business_id: businessId },
    { nome: "Tosa completa (grande)", duracao_minutos: 120, preco: 130.0, descricao: "Tosa completa para porte grande", ativo: true, business_id: businessId },
    { nome: "Consulta veterinária", duracao_minutos: 30, preco: 150.0, descricao: "Consulta veterinária", ativo: true, business_id: businessId },
    { nome: "Vacinação", duracao_minutos: 15, preco: 80.0, descricao: "Aplicação de vacinas", ativo: true, business_id: businessId },
    { nome: "Corte de unhas", duracao_minutos: 15, preco: 25.0, descricao: "Corte de unhas", ativo: true, business_id: businessId },
    { nome: "Limpeza de ouvidos", duracao_minutos: 20, preco: 30.0, descricao: "Limpeza de ouvidos", ativo: true, business_id: businessId },
    { nome: "Banho gatos", duracao_minutos: 60, preco: 80.0, descricao: "Banho para gatos", ativo: true, business_id: businessId }
  ];
}

function getDefaultServicesSurf(businessId) {
  return [
    { nome: "Aula de Surf - Individual", duracao_minutos: 60, preco: 110.0, descricao: "Aula individual de surf para iniciantes ou avançados", ativo: true, business_id: businessId },
    { nome: "Aula de Surf - Grupo", duracao_minutos: 60, preco: 90.0, descricao: "Aula de surf em grupo (até 4 pessoas)", ativo: true, business_id: businessId },
    { nome: "Aula de Bodyboard", duracao_minutos: 60, preco: 100.0, descricao: "Aula de bodyboard com prancha inclusa", ativo: true, business_id: businessId },
    { nome: "Aula de Stand Up Paddle (SUP)", duracao_minutos: 60, preco: 80.0, descricao: "Aula de stand up paddle para todos os níveis", ativo: true, business_id: businessId },
    { nome: "Aluguel de Prancha de Surf", duracao_minutos: 60, preco: 60.0, descricao: "Aluguel de prancha de surf por 3 horas", ativo: true, business_id: businessId },
    { nome: "Pacote 5 aulas de Surf", duracao_minutos: 60, preco: 450.0, descricao: "Pacote promocional com 5 aulas individuais de surf", ativo: true, business_id: businessId },
    { nome: "Pacote 10 aulas de surf", duracao_minutos: 60, preco: 850.0, descricao: "Pacote completo com 10 aulas de surf do zero ao independente", ativo: true, business_id: businessId }
  ];
}
