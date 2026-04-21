export interface Unit {
  id: string;
  name: string;
}

export interface Barber {
  id: string;
  name: string;
  unitId: string;
}

export type ArrivalStatus = 'SIM' | 'ATRASADO' | 'NÃO COMPARECEU';
export type StartStatus = 'SIM' | 'COM ATRASO' | 'ADIANTADO';
export type ComplaintStatus = 'NÃO' | 'SIM LEVE' | 'SIM GRAVE';
export type InterestStatus = 'ALTO' | 'BAIXO' | 'MÉDIO' | 'NENHUM';

export interface Evaluation {
  id: string;
  barberId: string;
  unitId: string;
  clientName: string;
  
  // 1. Dados do atendimento
  date: string; // ISO String (data da avaliação)
  serviceDate: string; // 2. Data do atendimento
  serviceTime: string; // 3. Horário do atendimento

  // 4. Barbeiro (já está em barberId)

  // 5. Pontualidade Cliente
  clientArrivalStatus: ArrivalStatus;
  
  // 6. Pontualidade Atendimento
  serviceStartStatus: StartStatus;

  // 7. Problema (se tiver)
  problemDescription: string;

  // 8. Reclamação
  complaintStatus: ComplaintStatus;

  // 9. Deixou Feedback
  leftFeedback: boolean;

  // 10. Qual foi o feedback
  feedbackDescription: string;

  // 11. Já é assinante
  isSubscriber: boolean;

  // 12. Foi ofertada assinatura
  offeredSubscription: boolean;

  // 13. Interesse na assinatura
  subscriptionInterest: InterestStatus;

  // 14. Necessita retorno/contato
  needsFollowUp: boolean;
  hadReturnRequest?: boolean; // Se o atendimento gerou um pedido de retorno (permanente)

  // 15. Observações gerais
  generalNotes: string;

  // 16. Nível de satisfação percebido (1-5)
  satisfactionLevel: number;
  
  // 17. Recomendaria
  wouldRecommend: boolean;
  
  // Média para compatibilidade (usaremos satisfactionLevel)
  rating: number; 

  season: string; // ex: "2026"
}

export const INITIAL_UNITS: Unit[] = [
  { id: 'centro', name: 'Centro' },
  { id: 'avenida', name: 'Avenida' },
  { id: 'efapi', name: 'Efapi' },
];

export const BARBER_LIST: {name: string, unitId: string}[] = [
  { name: 'JOHN', unitId: 'centro' },
  { name: 'VITOR', unitId: 'centro' },
  { name: 'THIAGO', unitId: 'centro' },
  { name: 'DOUGLAS', unitId: 'centro' },
  { name: 'JULIO', unitId: 'centro' },
  { name: 'ADILSON', unitId: 'centro' },
  { name: 'NASSER', unitId: 'avenida' },
  { name: 'HERNALDO', unitId: 'avenida' },
  { name: 'KAIQUE', unitId: 'efapi' },
  { name: 'CARLOS', unitId: 'efapi' },
  { name: 'CADU', unitId: 'efapi' },
];
