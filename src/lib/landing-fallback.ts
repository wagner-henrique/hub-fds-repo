import type { LandingSpace, LandingTestimonial } from "@/types/landing"

export const FALLBACK_SPACES: LandingSpace[] = [
	{
		id: "sala-arapiraca",
		title: "Sala Arapiraca",
		description:
			"Espaço moderno e descontraído, ideal para treinamentos, reuniões e encontros mais reservados, com identidade cultural inspirada em Arapiraca.",
		capacity: "Até 40 pessoas em cadeiras | até 20 com mesas e cadeiras",
		image: "/placeholder.svg",
		features: ["TV 55\"", "HDMI", "Som", "Microfone sem fio", "Microfone de lapela", "Climatizado"],
	},
	{
		id: "sala-reuniao",
		title: "Sala de Reunião",
		description:
			"Ambiente moderno, bonito e bem estruturado para encontros executivos, mentorias, entrevistas e reuniões estratégicas.",
		capacity: "Até 7 pessoas",
		image: "/placeholder.svg",
		features: ["TV 55\"", "HDMI", "Lousa branca", "Wi-Fi", "Climatizado", "Agua e cafe"],
	},
	{
		id: "auditorio",
		title: "Auditório",
		description:
			"Estrutura para workshops, treinamentos, palestras e eventos com apoio operacional e recursos multimídia.",
		capacity: "Até 60 pessoas",
		image: "/placeholder.svg",
		features: ["Projetor", "Som", "Eventos", "Recepção"],
	},
	{
		id: "centro-treinamento",
		title: "Centro de Treinamento",
		description:
			"Espaço dedicado para capacitações, aulas praticas e encontros corporativos em ambiente funcional.",
		capacity: "Até 40 pessoas",
		image: "/placeholder.svg",
		features: ["Treinamentos", "Apresentações", "Ambiente climatizado", "Estrutura flexível"],
	},
	{
		id: "endereco-fiscal",
		title: "Endereço Fiscal",
		description:
			"Obtenha um endereço fiscal em um espaço profissional e bem estruturado, agregando credibilidade ao seu negócio.",
		capacity: "Serviço recorrente",
		image: "/placeholder.svg",
		features: ["10h mensais da sala de reuniao", "15% de desconto em eventos", "Credibilidade", "CNPJ"],
	},
	{
		id: "ensaio-fotografico",
		title: "Ensaio Fotográfico",
		description:
			"Nosso espaço e perfeito para ensaios fotográficos e gravações, com ambientes internos e externos para produções versáteis.",
		capacity: "Sob consulta",
		image: "/placeholder.svg",
		features: ["Ambientes internos", "Áreas externas", "Gravações", "Produções"],
	},
]

export const FALLBACK_TESTIMONIALS: LandingTestimonial[] = [
	{
		id: "dep-estrutura",
		name: "Equipe Hub FDS",
		role: "Atendimento e operacao",
		content:
			"A estrutura foi pensada para atender diferentes perfis de uso, de reunioes rapidas ate eventos e treinamentos.",
		avatar: "/placeholder.svg",
	},
	{
		id: "dep-fiscal",
		name: "Clientes de Endereco Fiscal",
		role: "Empreendedorismo e regularizacao",
		content:
			"O servico de endereco fiscal entrega credibilidade e ainda ajuda a manter uma base profissional para o negocio.",
		avatar: "/placeholder.svg",
	},
	{
		id: "dep-eventos",
		name: "Organizadores de eventos",
		role: "Treinamentos e producoes",
		content:
			"Os espacos funcionam bem para fotos, reunioes, treinamentos e eventos, com uma experiencia pratica e organizada.",
		avatar: "/placeholder.svg",
	},
]