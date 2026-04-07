"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Grid3X3,
  Users, 
  Settings,
  Trash2,
  Edit3,
  Phone,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  LogOut,
  BriefcaseBusiness,
  ListTodo,
  MessageSquare,
  CircleDollarSign
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from '@/utils/toast';
import { signOut } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const bookingStatusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Concluído',
}

const leadStatusLabels: Record<string, string> = {
  NEW: 'Novo',
  CONTACTED: 'Contatado',
  QUALIFIED: 'Qualificado',
  LOST: 'Perdido',
}

const crmDealStageLabels: Record<string, string> = {
  LEAD: 'Lead',
  CONTACT: 'Contato',
  PROPOSAL: 'Proposta',
  NEGOTIATION: 'Negociação',
  WON: 'Ganho',
  LOST: 'Perdido',
}

const crmTaskStatusLabels: Record<string, string> = {
  OPEN: 'Aberta',
  IN_PROGRESS: 'Em andamento',
  DONE: 'Concluída',
  CANCELED: 'Cancelada',
}

const crmStagesOrder = ["LEAD", "CONTACT", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const

const operationalTimeSlots = [
  "08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"
]

const operationalRooms = [
  { id: "reuniao", label: "Sala de Reunião" },
  { id: "treinamento", label: "Sala de Treinamento" },
  { id: "coworking", label: "Coworking" },
]

const adminTabs = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'bookings', icon: CalendarIcon, label: 'Agendamentos' },
  { id: 'operational', icon: Grid3X3, label: 'Operacional' },
  { id: 'clients', icon: Users, label: 'Clientes' },
  { id: 'crm', icon: BriefcaseBusiness, label: 'CRM' },
  { id: 'leads', icon: Users, label: 'Leads' },
  { id: 'settings', icon: Settings, label: 'Configurações' },
]

const validAdminTabIds = new Set(adminTabs.map((tab) => tab.id))

const getTabFromPathname = (pathname: string) => {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] !== 'admin') return 'dashboard'
  const fromPath = parts[1]
  if (!fromPath) return 'dashboard'
  return validAdminTabIds.has(fromPath) ? fromPath : 'dashboard'
}

const tabMeta: Record<string, { title: string; description: string }> = {
  dashboard: {
    title: 'Painel Administrativo',
    description: 'Visão consolidada das reservas e contatos do HUB FDS.',
  },
  bookings: {
    title: 'Agendamentos',
    description: 'Acompanhe, edite e crie reservas manuais.',
  },
  operational: {
    title: 'Painel Operacional',
    description: 'Ocupação por sala e horário com atualização rápida.',
  },
  clients: {
    title: 'Clientes',
    description: 'Cadastro, histórico e vínculo automático com agendamentos.',
  },
  crm: {
    title: 'CRM Comercial',
    description: 'Pipeline de oportunidades, tarefas e histórico de relacionamento.',
  },
  leads: {
    title: 'Leads',
    description: 'Gerencie status e evolução dos contatos captados.',
  },
  settings: {
    title: 'Configurações',
    description: 'Controle de usuários e permissões de acesso.',
  },
}

export function AdminDashboard({ forcedTab }: { forcedTab?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialPathTab = getTabFromPathname(pathname || '/admin')
  const initialQueryTab = searchParams.get('tab')
  const initialTab = forcedTab || initialPathTab || (initialQueryTab && validAdminTabIds.has(initialQueryTab) ? initialQueryTab : 'dashboard')

  const [bookings, setBookings] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [operationalDate, setOperationalDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [operationalBookings, setOperationalBookings] = useState<any[]>([]);
  const [operationalLoading, setOperationalLoading] = useState(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "RECEPTION",
  });
  
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [newBooking, setNewBooking] = useState({
    name: "",
    email: "",
    phone: "",
    room: "reuniao",
    date: "",
    time: "08:00",
    source: "whatsapp",
    status: "CONFIRMED",
    notes: "",
  });
  const [clients, setClients] = useState<any[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsPage, setClientsPage] = useState(1);
  const [clientsTotalPages, setClientsTotalPages] = useState(1);
  const [clientsSearchInput, setClientsSearchInput] = useState("");
  const [clientsSearchTerm, setClientsSearchTerm] = useState("");
  const [isCreateClientDialogOpen, setIsCreateClientDialogOpen] = useState(false);
  const [isEditClientDialogOpen, setIsEditClientDialogOpen] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  const [updatingClient, setUpdatingClient] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [newClient, setNewClient] = useState({
    name: "",
    type: "PF",
    email: "",
    phone: "",
    whatsapp: "",
    cpf: "",
    cnpj: "",
    birthDate: "",
    address: "",
    notes: "",
  });
  const [crmSummary, setCrmSummary] = useState<any>(null);
  const [crmDeals, setCrmDeals] = useState<any[]>([]);
  const [crmTasks, setCrmTasks] = useState<any[]>([]);
  const [crmActivities, setCrmActivities] = useState<any[]>([]);
  const [crmLoading, setCrmLoading] = useState(false);
  const [isCreateDealDialogOpen, setIsCreateDealDialogOpen] = useState(false);
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [isCreateActivityDialogOpen, setIsCreateActivityDialogOpen] = useState(false);
  const [creatingDeal, setCreatingDeal] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [creatingActivity, setCreatingActivity] = useState(false);
  const [isEditDealDialogOpen, setIsEditDealDialogOpen] = useState(false);
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
  const [updatingDeal, setUpdatingDeal] = useState(false);
  const [updatingTask, setUpdatingTask] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [crmDealStageFilter, setCrmDealStageFilter] = useState("ALL");
  const [crmTaskStatusFilter, setCrmTaskStatusFilter] = useState("ALL");
  const [crmPeriodFilter, setCrmPeriodFilter] = useState("ALL");
  const [draggingDealId, setDraggingDealId] = useState<string | null>(null);
  const [newDeal, setNewDeal] = useState({
    title: "",
    description: "",
    value: "0",
    stage: "LEAD",
    expectedCloseDate: "",
    source: "",
    clientId: "",
  });
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: "",
    status: "OPEN",
    priority: "MEDIUM",
    clientId: "",
    dealId: "",
  });
  const [newActivity, setNewActivity] = useState({
    type: "NOTE",
    content: "",
    clientId: "",
    dealId: "",
  });
  const [compactMode, setCompactMode] = useState(false);
  const [tabSwitchLoading, setTabSwitchLoading] = useState(false);
  const isFirstTabRender = useRef(true);
  const crmRequestControllerRef = useRef<AbortController | null>(null);

  const tableHeadBaseClass = compactMode
    ? "py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
    : "py-5 text-xs font-semibold uppercase tracking-wide text-slate-500";

  const tableCellBaseClass = compactMode ? "py-3" : "py-6";

  const updateCrmFiltersInUrl = (updates: { dealStage?: string; taskStatus?: string; period?: string }) => {
    const params = new URLSearchParams(searchParams.toString())
    const finalDealStage = updates.dealStage ?? crmDealStageFilter
    const finalTaskStatus = updates.taskStatus ?? crmTaskStatusFilter
    const finalPeriod = updates.period ?? crmPeriodFilter

    if (finalDealStage === 'ALL') params.delete('dealStage')
    else params.set('dealStage', finalDealStage)

    if (finalTaskStatus === 'ALL') params.delete('taskStatus')
    else params.set('taskStatus', finalTaskStatus)

    if (finalPeriod === 'ALL') params.delete('period')
    else params.set('period', finalPeriod)

    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname)
  }

  const handleTabChange = (tabId: string) => {
    if (tabId === activeTab) return;
    setActiveTab(tabId);

    const targetPath = tabId === 'dashboard' ? '/admin' : `/admin/${tabId}`
    const params = new URLSearchParams(searchParams.toString())
    params.delete('tab')

    if (tabId !== 'crm') {
      params.delete('dealStage')
      params.delete('taskStatus')
      params.delete('period')
    }

    const query = params.toString()
    router.push(query ? `${targetPath}?${query}` : targetPath)
  };

  useEffect(() => {
    const pathTab = getTabFromPathname(pathname || '/admin')
    const queryTab = searchParams.get('tab')
    const resolvedTab = forcedTab || pathTab || (queryTab && validAdminTabIds.has(queryTab) ? queryTab : 'dashboard')
    if (resolvedTab !== activeTab) {
      setActiveTab(resolvedTab)
    }
  }, [forcedTab, pathname, searchParams, activeTab])

  useEffect(() => {
    if (activeTab !== 'crm') return

    const stageFromQuery = searchParams.get('dealStage') || 'ALL'
    const statusFromQuery = searchParams.get('taskStatus') || 'ALL'
    const periodFromQuery = searchParams.get('period') || 'ALL'

    if (stageFromQuery !== crmDealStageFilter) setCrmDealStageFilter(stageFromQuery)
    if (statusFromQuery !== crmTaskStatusFilter) setCrmTaskStatusFilter(statusFromQuery)
    if (periodFromQuery !== crmPeriodFilter) setCrmPeriodFilter(periodFromQuery)
  }, [activeTab, searchParams])

  const fetchData = async (currentPage: number) => {
    setLoading(true);
    try {
      const [bookingsRes, leadsRes] = await Promise.all([
        fetch(`/api/bookings?page=${currentPage}&limit=10`),
        fetch('/api/leads')
      ]);

      if (bookingsRes.status === 401 || leadsRes.status === 401) {
        await signOut({ callbackUrl: '/login' });
        return;
      }

      const bookingsData = await bookingsRes.json();
      const leadsData = await leadsRes.json();
      setBookings(bookingsData.data || []);
      setTotalPages(bookingsData.meta?.totalPages || 1);
      setLeads(leadsData.data || []);
    } catch (error) {
      showError("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setCompactMode(true);
    }
  }, []);

  useEffect(() => {
    if (isFirstTabRender.current) {
      isFirstTabRender.current = false;
      return;
    }

    setTabSwitchLoading(true);
    const timeout = setTimeout(() => {
      setTabSwitchLoading(false);
    }, 380);

    return () => clearTimeout(timeout);
  }, [activeTab]);

  const fetchOperationalData = async (date: string) => {
    setOperationalLoading(true);
    try {
      const response = await fetch(`/api/bookings?date=${date}&page=1&limit=200`);
      if (response.status === 401) {
        await signOut({ callbackUrl: '/login' });
        return;
      }
      const result = await response.json();
      setOperationalBookings(result?.data || []);
    } catch {
      showError("Erro ao carregar visão operacional.");
    } finally {
      setOperationalLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "operational") {
      fetchOperationalData(operationalDate);
    }
  }, [activeTab, operationalDate]);

  const findOperationalBooking = (roomId: string, slot: string) => {
    return operationalBookings.find((booking) => booking.room === roomId && booking.time === slot);
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      if (response.status === 401 || response.status === 403) {
        await signOut({ callbackUrl: '/login' });
        return;
      }

      const data = await response.json();
      setAdminUsers(data?.data || []);
    } catch {
      showError('Erro ao carregar usuários.');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchClients = async (page: number, search: string) => {
    setClientsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(`/api/clients?${params.toString()}`);
      if (response.status === 401 || response.status === 403) {
        await signOut({ callbackUrl: '/login' });
        return;
      }

      const result = await response.json();
      setClients(result?.data || []);
      setClientsTotalPages(result?.meta?.totalPages || 1);
    } catch {
      showError("Erro ao carregar clientes.");
    } finally {
      setClientsLoading(false);
    }
  };

  const fetchCrmData = async () => {
    setCrmLoading(true);
    crmRequestControllerRef.current?.abort();
    const controller = new AbortController();
    crmRequestControllerRef.current = controller;

    try {
      const params = new URLSearchParams();
      if (crmDealStageFilter && crmDealStageFilter !== 'ALL') params.set('dealStage', crmDealStageFilter);
      if (crmTaskStatusFilter && crmTaskStatusFilter !== 'ALL') params.set('taskStatus', crmTaskStatusFilter);
      if (crmPeriodFilter && crmPeriodFilter !== 'ALL') params.set('period', crmPeriodFilter);

      const response = await fetch(`/api/crm/dashboard?${params.toString()}`, {
        signal: controller.signal,
      });

      if (response.status === 401 || response.status === 403) {
        await signOut({ callbackUrl: '/login' });
        return;
      }

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Falha ao carregar CRM');
      }

      setCrmSummary(payload?.summary || null);
      setCrmDeals(payload?.deals || []);
      setCrmTasks(payload?.tasks || []);
      setCrmActivities(payload?.activities || []);
      setClients(payload?.clients || []);
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      showError('Erro ao carregar dados do CRM.');
    } finally {
      setCrmLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchUsers();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'clients') {
      fetchClients(clientsPage, clientsSearchTerm);
    }
  }, [activeTab, clientsPage, clientsSearchTerm]);

  useEffect(() => {
    if (activeTab !== 'crm') return;

    const timeout = setTimeout(() => {
      fetchCrmData();
    }, 120);

    return () => clearTimeout(timeout);
  }, [activeTab, crmDealStageFilter, crmTaskStatusFilter, crmPeriodFilter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUser.name || !newUser.email || !newUser.password) {
      showError('Preencha nome, e-mail e senha.');
      return;
    }

    setCreatingUser(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Falha ao criar usuário.');
      }

      showSuccess('Usuário criado com sucesso.');
      setNewUser({ name: '', email: '', password: '', role: 'RECEPTION' });
      fetchUsers();
    } catch (error: any) {
      showError(error?.message || 'Erro ao criar usuário.');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleToggleUserActive = async (user: any) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Falha ao atualizar usuário.');
      }

      showSuccess('Status do usuário atualizado.');
      setAdminUsers((prev) => prev.map((item) => item.id === user.id ? { ...item, isActive: !item.isActive } : item));
    } catch (error: any) {
      showError(error?.message || 'Erro ao atualizar usuário.');
    }
  };

  const handleChangeUserRole = async (user: any, role: "ADMIN" | "RECEPTION") => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Falha ao atualizar perfil.');
      }

      showSuccess('Perfil do usuário atualizado.');
      setAdminUsers((prev) => prev.map((item) => item.id === user.id ? { ...item, role } : item));
    } catch (error: any) {
      showError(error?.message || 'Erro ao atualizar perfil.');
    }
  };

  const clearNewClient = () => {
    setNewClient({
      name: "",
      type: "PF",
      email: "",
      phone: "",
      whatsapp: "",
      cpf: "",
      cnpj: "",
      birthDate: "",
      address: "",
      notes: "",
    });
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newClient.name || !newClient.email || !newClient.phone) {
      showError("Preencha nome, e-mail e telefone.");
      return;
    }

    setCreatingClient(true);
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Falha ao criar cliente.');
      }

      showSuccess('Cliente cadastrado com sucesso.');
      setIsCreateClientDialogOpen(false);
      clearNewClient();
      fetchClients(clientsPage, clientsSearchTerm);
    } catch (error: any) {
      showError(error?.message || 'Erro ao criar cliente.');
    } finally {
      setCreatingClient(false);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingClient?.id) {
      showError('Cliente inválido para atualização.');
      return;
    }

    setUpdatingClient(true);
    try {
      const response = await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingClient),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Falha ao atualizar cliente.');
      }

      showSuccess('Cliente atualizado com sucesso.');
      setIsEditClientDialogOpen(false);
      setEditingClient(null);
      fetchClients(clientsPage, clientsSearchTerm);
    } catch (error: any) {
      showError(error?.message || 'Erro ao atualizar cliente.');
    } finally {
      setUpdatingClient(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm("Deseja realmente excluir este cliente?")) return;

    try {
      const response = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Falha ao excluir cliente.');
      }

      showSuccess('Cliente excluído com sucesso.');
      fetchClients(clientsPage, clientsSearchTerm);
    } catch (error: any) {
      showError(error?.message || 'Erro ao excluir cliente.');
    }
  };

  const applyClientsSearch = () => {
    setClientsPage(1);
    setClientsSearchTerm(clientsSearchInput);
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeal.title || !newDeal.clientId) {
      showError('Informe título e cliente para o negócio.');
      return;
    }

    setCreatingDeal(true);
    try {
      const response = await fetch('/api/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newDeal,
          value: Number(newDeal.value || 0),
          description: newDeal.description || null,
          expectedCloseDate: newDeal.expectedCloseDate || null,
          source: newDeal.source || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Falha ao criar negócio.');

      showSuccess('Negócio criado com sucesso.');
      setIsCreateDealDialogOpen(false);
      setNewDeal({ title: '', description: '', value: '0', stage: 'LEAD', expectedCloseDate: '', source: '', clientId: '' });
      fetchCrmData();
    } catch (error: any) {
      showError(error?.message || 'Erro ao criar negócio.');
    } finally {
      setCreatingDeal(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || (!newTask.clientId && !newTask.dealId)) {
      showError('Informe título e vínculo (cliente ou negócio).');
      return;
    }

    setCreatingTask(true);
    try {
      const response = await fetch('/api/crm/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          description: newTask.description || null,
          dueDate: newTask.dueDate || null,
          clientId: newTask.clientId || null,
          dealId: newTask.dealId || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Falha ao criar tarefa.');

      showSuccess('Tarefa criada com sucesso.');
      setIsCreateTaskDialogOpen(false);
      setNewTask({ title: '', description: '', dueDate: '', status: 'OPEN', priority: 'MEDIUM', clientId: '', dealId: '' });
      fetchCrmData();
    } catch (error: any) {
      showError(error?.message || 'Erro ao criar tarefa.');
    } finally {
      setCreatingTask(false);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.content || (!newActivity.clientId && !newActivity.dealId)) {
      showError('Informe conteúdo e vínculo (cliente ou negócio).');
      return;
    }

    setCreatingActivity(true);
    try {
      const response = await fetch('/api/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newActivity,
          clientId: newActivity.clientId || null,
          dealId: newActivity.dealId || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Falha ao registrar interação.');

      showSuccess('Interação registrada com sucesso.');
      setIsCreateActivityDialogOpen(false);
      setNewActivity({ type: 'NOTE', content: '', clientId: '', dealId: '' });
      fetchCrmData();
    } catch (error: any) {
      showError(error?.message || 'Erro ao registrar interação.');
    } finally {
      setCreatingActivity(false);
    }
  };

  const handleDealStageChange = async (deal: any, stage: string) => {
    try {
      const response = await fetch(`/api/crm/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: deal.title,
          description: deal.description,
          value: deal.value,
          stage,
          expectedCloseDate: deal.expectedCloseDate,
          source: deal.source,
          clientId: deal.clientId,
        }),
      });

      if (!response.ok) throw new Error();
      setCrmDeals((prev) => prev.map((item) => item.id === deal.id ? { ...item, stage } : item));
      showSuccess('Etapa do negócio atualizada.');
    } catch {
      showError('Erro ao atualizar etapa do negócio.');
    }
  };

  const handleUpdateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeal?.id) {
      showError('Negócio inválido para edição.');
      return;
    }

    setUpdatingDeal(true);
    try {
      const response = await fetch(`/api/crm/deals/${editingDeal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingDeal,
          value: Number(editingDeal.value || 0),
          expectedCloseDate: editingDeal.expectedCloseDate || null,
          description: editingDeal.description || null,
          source: editingDeal.source || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Falha ao atualizar negócio.');

      showSuccess('Negócio atualizado com sucesso.');
      setIsEditDealDialogOpen(false);
      setEditingDeal(null);
      fetchCrmData();
    } catch (error: any) {
      showError(error?.message || 'Erro ao atualizar negócio.');
    } finally {
      setUpdatingDeal(false);
    }
  };

  const handleTaskStatusChange = async (task: any, status: string) => {
    try {
      const response = await fetch(`/api/crm/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          status,
          priority: task.priority,
          clientId: task.clientId,
          dealId: task.dealId,
        }),
      });

      if (!response.ok) throw new Error();
      setCrmTasks((prev) => prev.map((item) => item.id === task.id ? { ...item, status } : item));
      showSuccess('Status da tarefa atualizado.');
    } catch {
      showError('Erro ao atualizar status da tarefa.');
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask?.id) {
      showError('Tarefa inválida para edição.');
      return;
    }

    setUpdatingTask(true);
    try {
      const response = await fetch(`/api/crm/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingTask,
          dueDate: editingTask.dueDate || null,
          description: editingTask.description || null,
          clientId: editingTask.clientId || null,
          dealId: editingTask.dealId || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Falha ao atualizar tarefa.');

      showSuccess('Tarefa atualizada com sucesso.');
      setIsEditTaskDialogOpen(false);
      setEditingTask(null);
      fetchCrmData();
    } catch (error: any) {
      showError(error?.message || 'Erro ao atualizar tarefa.');
    } finally {
      setUpdatingTask(false);
    }
  };

  const filteredCrmDeals = useMemo(() => {
    return crmDeals
  }, [crmDeals]);

  const filteredCrmTasks = useMemo(() => {
    return crmTasks
  }, [crmTasks]);

  const filteredCrmActivities = useMemo(() => {
    return crmActivities
  }, [crmActivities]);

  const groupedDealsByStage = useMemo(() => {
    return crmStagesOrder.reduce((acc, stage) => {
      acc[stage] = filteredCrmDeals.filter((deal) => deal.stage === stage);
      return acc;
    }, {} as Record<string, any[]>);
  }, [filteredCrmDeals]);

  const handleDropDealOnStage = async (stage: string) => {
    if (!draggingDealId) return;
    const dragged = crmDeals.find((item) => item.id === draggingDealId);
    if (!dragged || dragged.stage === stage) {
      setDraggingDealId(null);
      return;
    }

    await handleDealStageChange(dragged, stage);
    setDraggingDealId(null);
  };

  const handleDeleteDeal = async (id: string) => {
    if (!confirm('Deseja excluir este negócio?')) return;
    try {
      const response = await fetch(`/api/crm/deals/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error();
      setCrmDeals((prev) => prev.filter((item) => item.id !== id));
      showSuccess('Negócio excluído.');
    } catch {
      showError('Erro ao excluir negócio.');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Deseja excluir esta tarefa?')) return;
    try {
      const response = await fetch(`/api/crm/tasks/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error();
      setCrmTasks((prev) => prev.filter((item) => item.id !== id));
      showSuccess('Tarefa excluída.');
    } catch {
      showError('Erro ao excluir tarefa.');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = activeTab === "bookings" ? `/api/bookings/${editingItem.id}` : `/api/leads/${editingItem.id}`;
    
    const previousState = activeTab === "bookings" ? [...bookings] : [...leads];
    
    if (activeTab === "bookings") {
      setBookings(prev => prev.map(b => b.id === editingItem.id ? editingItem : b));
    } else {
      setLeads(prev => prev.map(l => l.id === editingItem.id ? editingItem : l));
    }

    setIsEditDialogOpen(false);

    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem)
      });
      
      if (!res.ok) throw new Error();
      showSuccess("Registro atualizado!");
    } catch (error) {
      if (activeTab === "bookings") setBookings(previousState);
      else setLeads(previousState);
      showError("Erro ao atualizar.");
    }
  };

  const handleDelete = async (id: string, type: 'bookings' | 'leads') => {
    if (!confirm("Deseja realmente excluir este registro?")) return;

    const previousState = type === 'bookings' ? [...bookings] : [...leads];
    
    if (type === 'bookings') {
      setBookings(prev => prev.filter(b => b.id !== id));
    } else {
      setLeads(prev => prev.filter(l => l.id !== id));
    }

    try {
      const res = await fetch(`/api/${type}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showSuccess("Excluído com sucesso.");
    } catch (error) {
      if (type === 'bookings') setBookings(previousState);
      else setLeads(previousState);
      showError("Erro ao excluir.");
    }
  };

  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newBooking.name || !newBooking.email || !newBooking.date || !newBooking.time) {
      showError("Preencha nome, e-mail, data e horário.");
      return;
    }

    setCreatingBooking(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBooking.name,
          email: newBooking.email,
          phone: newBooking.phone,
          room: newBooking.room,
          date: newBooking.date,
          time: newBooking.time,
          notes: newBooking.notes,
          payment: {
            method: 'manual',
            source: newBooking.source,
            status: newBooking.status,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Falha ao criar agendamento manual.");
      }

      showSuccess("Agendamento manual criado com sucesso.");
      setIsCreateDialogOpen(false);
      setNewBooking({
        name: "",
        email: "",
        phone: "",
        room: "reuniao",
        date: "",
        time: "08:00",
        source: "whatsapp",
        status: "CONFIRMED",
        notes: "",
      });
      fetchData(page);
    } catch (error: any) {
      showError(error?.message || "Erro ao criar agendamento manual.");
    } finally {
      setCreatingBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(7,151,140,0.09),transparent_55%)]">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-6 md:px-6 md:py-8 lg:flex-row">
      <aside className="w-full rounded-3xl border border-primary/10 bg-white/90 p-6 shadow-sm backdrop-blur lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[280px] lg:shrink-0">
        <div className="flex h-full flex-col gap-8">
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-base font-semibold text-white">H</div>
          <div>
            <p className="text-sm font-medium text-slate-500">Painel</p>
            <span className="text-xl font-semibold tracking-tight text-primary">HUB Admin</span>
          </div>
        </div>

        <nav className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-1">
          {adminTabs.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all ${
                activeTab === item.id 
                ? 'bg-primary text-white shadow-md shadow-primary/25' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-100 pt-5">
          <Button
            variant="outline"
            className="w-full rounded-2xl border-slate-200 font-medium"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut size={16} className="mr-2" />
            Sair
          </Button>
        </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto rounded-3xl border border-slate-200/70 bg-white/85 p-5 shadow-sm backdrop-blur md:p-8">
        <header className="mb-8 flex flex-col gap-4 border-b border-slate-100 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              {tabMeta[activeTab]?.title || "Painel Administrativo"}
            </h1>
            <p className="max-w-2xl text-sm text-slate-500 md:text-base">
              {tabMeta[activeTab]?.description || "Gerencie as reservas e contatos do HUB FDS."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200"
              onClick={() => setCompactMode((prev) => !prev)}
            >
              {compactMode ? "Modo confortável" : "Modo compacto"}
            </Button>
            {activeTab === "bookings" && (
              <>
                <Button className="rounded-xl" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus size={16} className="mr-2" />
                  Novo agendamento manual
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  disabled={page === 1} 
                  onClick={() => setPage(p => p - 1)}
                  className="rounded-xl"
                >
                  <ChevronLeft size={18} />
                </Button>
                <span className="px-2 text-sm font-semibold text-slate-600">Página {page} de {totalPages}</span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  disabled={page === totalPages} 
                  onClick={() => setPage(p => p + 1)}
                  className="rounded-xl"
                >
                  <ChevronRight size={18} />
                </Button>
              </>
            )}
              {activeTab === "clients" && (
                <>
                  <Button className="rounded-xl" onClick={() => setIsCreateClientDialogOpen(true)}>
                    <Plus size={16} className="mr-2" />
                    Novo cliente
                  </Button>
                  <Input
                    className="h-9 w-[220px] rounded-xl"
                    placeholder="Buscar por nome, e-mail..."
                    value={clientsSearchInput}
                    onChange={(e) => setClientsSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        applyClientsSearch();
                      }
                    }}
                  />
                  <Button variant="outline" className="rounded-xl" onClick={applyClientsSearch}>
                    Buscar
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={clientsPage === 1}
                    onClick={() => setClientsPage((p) => p - 1)}
                    className="rounded-xl"
                  >
                    <ChevronLeft size={18} />
                  </Button>
                  <span className="px-2 text-sm font-semibold text-slate-600">Página {clientsPage} de {clientsTotalPages}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={clientsPage === clientsTotalPages}
                    onClick={() => setClientsPage((p) => p + 1)}
                    className="rounded-xl"
                  >
                    <ChevronRight size={18} />
                  </Button>
                </>
              )}
              {activeTab === "crm" && (
                <>
                  <Button className="rounded-xl" onClick={() => setIsCreateDealDialogOpen(true)}>
                    <BriefcaseBusiness size={16} className="mr-2" />
                    Novo negócio
                  </Button>
                  <Button variant="outline" className="rounded-xl" onClick={() => setIsCreateTaskDialogOpen(true)}>
                    <ListTodo size={16} className="mr-2" />
                    Nova tarefa
                  </Button>
                  <Button variant="outline" className="rounded-xl" onClick={() => setIsCreateActivityDialogOpen(true)}>
                    <MessageSquare size={16} className="mr-2" />
                    Nova interação
                  </Button>
                </>
              )}
          </div>
        </header>

        {tabSwitchLoading && (
          <div className="mb-6 overflow-hidden rounded-full bg-primary/10">
            <div className="h-1 w-1/3 animate-pulse rounded-full bg-primary/70" />
          </div>
        )}

        {activeTab === "dashboard" && (
          <>
            <div className="mb-8 grid gap-4 md:grid-cols-3">
              <Card className="rounded-3xl border border-slate-100 bg-white p-6 shadow-none">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Total de Reservas</p>
                    <h3 className="text-4xl font-semibold text-slate-900">{bookings.length}</h3>
                  </div>
                  <div className="rounded-xl bg-primary/10 p-3 text-primary">
                    <CalendarIcon size={24} />
                  </div>
                </div>
                <p className="text-xs text-slate-400">Dados da página atual</p>
              </Card>

              <Card className="rounded-3xl border border-slate-100 bg-white p-6 shadow-none">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Novos Leads</p>
                    <h3 className="text-4xl font-semibold text-slate-900">{leads.length}</h3>
                  </div>
                  <div className="rounded-xl bg-primary/10 p-3 text-primary">
                    <Users size={24} />
                  </div>
                </div>
                <p className="text-xs text-slate-400">Total captado</p>
              </Card>

              <Card className="rounded-3xl border border-slate-100 bg-white p-6 shadow-none">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Taxa de Conversão</p>
                    <h3 className="text-4xl font-semibold text-slate-900">24%</h3>
                  </div>
                  <div className="rounded-xl bg-primary/10 p-3 text-primary">
                    <Clock size={24} />
                  </div>
                </div>
                <p className="text-xs text-slate-400">Média de fechamento</p>
              </Card>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white">
              <div className="border-b border-slate-100 p-6">
                <h2 className="text-xl font-semibold text-slate-900">Agendamentos Recentes</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-none bg-slate-50/70">
                    <TableHead className={`px-8 ${tableHeadBaseClass}`}>Cliente</TableHead>
                    <TableHead className={tableHeadBaseClass}>Data</TableHead>
                    <TableHead className={tableHeadBaseClass}>Horário</TableHead>
                    <TableHead className={tableHeadBaseClass}>Status</TableHead>
                    <TableHead className={`px-8 text-right ${tableHeadBaseClass}`}>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-20 text-center text-slate-400 font-medium">
                        Nenhum agendamento encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    bookings.slice(0, 5).map((item: any) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                        <TableCell className={`${tableCellBaseClass} px-8`}>
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-xs text-slate-400">{item.email}</div>
                        </TableCell>
                        <TableCell className={`${tableCellBaseClass} font-medium text-slate-600`}>
                          {new Date(item.date).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className={`${tableCellBaseClass} font-bold text-primary`}>
                          {item.time}
                        </TableCell>
                        <TableCell className={tableCellBaseClass}>
                          <Badge className={`rounded-lg px-3 py-1 font-bold ${
                            item.status === 'CONFIRMED' ? 'bg-primary' : item.status === 'CANCELLED' ? 'bg-red-500' : 'bg-amber-500'
                          }`}>
                            {bookingStatusLabels[item.status] || item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className={`${tableCellBaseClass} px-8 text-right`}>
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" onClick={() => { setEditingItem(item); setIsEditDialogOpen(true); }}>
                              <Edit3 size={18} className="text-primary" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDelete(item.id, 'bookings')}>
                              <Trash2 size={18} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {(activeTab === "bookings" || activeTab === "leads") && (
          <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="border-none bg-slate-50/70">
                  <TableHead className={`px-8 ${tableHeadBaseClass}`}>Informações</TableHead>
                  <TableHead className={tableHeadBaseClass}>{activeTab === "bookings" ? "Data/Hora" : "Origem"}</TableHead>
                  <TableHead className={tableHeadBaseClass}>Status</TableHead>
                  <TableHead className={`px-8 text-right ${tableHeadBaseClass}`}>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(activeTab === "bookings" ? bookings : leads).map((item: any) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                    <TableCell className={`${tableCellBaseClass} px-8`}>
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-400">{item.email}</div>
                      {item.phone && <div className="text-[10px] font-bold text-primary flex items-center gap-1 mt-1"><Phone size={10} /> {item.phone}</div>}
                    </TableCell>
                    <TableCell className={tableCellBaseClass}>
                      {activeTab === "bookings" ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-600">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                          <span className="text-xs font-bold text-primary">{item.time}</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="rounded-lg">{item.source}</Badge>
                      )}
                    </TableCell>
                    <TableCell className={tableCellBaseClass}>
                      <Badge className={`rounded-lg px-3 py-1 font-bold ${
                        ['CONFIRMED', 'QUALIFIED'].includes(item.status) ? 'bg-primary' : item.status === 'CANCELLED' || item.status === 'LOST' ? 'bg-red-500' : 'bg-amber-500'
                      }`}>
                        {activeTab === "bookings" ? (bookingStatusLabels[item.status] || item.status) : (leadStatusLabels[item.status] || item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className={`${tableCellBaseClass} px-8 text-right`}>
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => { setEditingItem(item); setIsEditDialogOpen(true); }}>
                          <Edit3 size={18} className="text-primary" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDelete(item.id, activeTab as any)}>
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {activeTab === "operational" && (
          <div className="space-y-6">
            <Card className="rounded-3xl border border-slate-100 bg-white p-6 shadow-none">
              <div className="flex items-center gap-4">
                <Label className="font-bold">Data da operação</Label>
                <Input
                  type="date"
                  className="max-w-xs rounded-xl"
                  value={operationalDate}
                  onChange={(e) => setOperationalDate(e.target.value)}
                />
                <Button variant="outline" className="rounded-xl" onClick={() => fetchOperationalData(operationalDate)}>
                  Atualizar grade
                </Button>
              </div>
            </Card>

            <div className="overflow-auto rounded-[2rem] border border-slate-100 bg-white">
              <table className="w-full min-w-[980px]">
                <thead>
                  <tr className="bg-slate-50/30 border-b border-slate-100">
                    <th className={`px-6 text-left ${tableHeadBaseClass}`}>Sala / Horário</th>
                    {operationalTimeSlots.map((slot) => (
                      <th key={slot} className={`px-4 text-center ${tableHeadBaseClass}`}>{slot}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {operationalRooms.map((room) => (
                    <tr key={room.id} className="border-b border-slate-50">
                      <td className={`${compactMode ? 'py-3' : 'py-4'} px-6 font-bold text-slate-700`}>{room.label}</td>
                      {operationalTimeSlots.map((slot) => {
                        const booking = findOperationalBooking(room.id, slot)

                        if (!booking) {
                          return (
                            <td key={`${room.id}-${slot}`} className={`${compactMode ? 'py-3' : 'py-4'} px-3 text-center`}>
                              <Badge variant="outline" className="rounded-lg text-slate-400 border-slate-200">Livre</Badge>
                            </td>
                          )
                        }

                        return (
                          <td key={`${room.id}-${slot}`} className={`${compactMode ? 'py-3' : 'py-4'} px-3 text-center`}>
                            <div className="flex flex-col items-center gap-1">
                              <Badge className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                                booking.status === "CONFIRMED"
                                  ? "bg-primary"
                                  : booking.status === "CANCELLED"
                                    ? "bg-red-500"
                                    : "bg-amber-500"
                              }`}>
                                {bookingStatusLabels[booking.status] || booking.status}
                              </Badge>
                              <span className="text-[10px] text-slate-500 font-medium leading-tight max-w-[100px] truncate" title={booking.name}>
                                {booking.name}
                              </span>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {operationalLoading && (
              <p className="text-sm text-slate-500 font-medium">Atualizando visão operacional...</p>
            )}
          </div>
        )}

        {activeTab === "clients" && (
          <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="border-none bg-slate-50/70">
                  <TableHead className={`px-8 ${tableHeadBaseClass}`}>Cliente</TableHead>
                  <TableHead className={tableHeadBaseClass}>Contato</TableHead>
                  <TableHead className={tableHeadBaseClass}>Documento</TableHead>
                  <TableHead className={tableHeadBaseClass}>Agendamentos</TableHead>
                  <TableHead className={`px-8 text-right ${tableHeadBaseClass}`}>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-slate-400">
                      Carregando clientes...
                    </TableCell>
                  </TableRow>
                ) : clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-slate-400">
                      Nenhum cliente encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.id} className="border-slate-50 transition-colors hover:bg-slate-50/50">
                      <TableCell className={`${tableCellBaseClass} px-8`}>
                        <div className="font-bold text-slate-900">{client.name}</div>
                        <div className="text-xs text-slate-400">{client.type === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}</div>
                      </TableCell>
                      <TableCell className={tableCellBaseClass}>
                        <div className="text-sm text-slate-700">{client.email}</div>
                        <div className="text-xs text-slate-500">{client.phone}</div>
                        {client.whatsapp && <div className="text-xs text-slate-500">WhatsApp: {client.whatsapp}</div>}
                      </TableCell>
                      <TableCell className={tableCellBaseClass}>
                        <div className="text-sm text-slate-700">{client.cpf || client.cnpj || "-"}</div>
                      </TableCell>
                      <TableCell className={tableCellBaseClass}>
                        <Badge variant="outline" className="rounded-lg">
                          {client?._count?.bookings ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell className={`${tableCellBaseClass} px-8 text-right`}>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingClient({
                                ...client,
                                birthDate: client.birthDate ? new Date(client.birthDate).toISOString().split("T")[0] : "",
                              });
                              setIsEditClientDialogOpen(true);
                            }}
                          >
                            <Edit3 size={18} className="text-primary" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-500"
                            onClick={() => handleDeleteClient(client.id)}
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {activeTab === "crm" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="rounded-3xl border border-slate-100 bg-white p-5 shadow-none">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Pipeline aberto</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{crmSummary?.openDeals ?? 0}</p>
              </Card>
              <Card className="rounded-3xl border border-slate-100 bg-white p-5 shadow-none">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Negócios ganhos</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{crmSummary?.wonDeals ?? 0}</p>
              </Card>
              <Card className="rounded-3xl border border-slate-100 bg-white p-5 shadow-none">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Tarefas em aberto</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{crmSummary?.tasksOpen ?? 0}</p>
              </Card>
              <Card className="rounded-3xl border border-slate-100 bg-white p-5 shadow-none">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Valor em pipeline</p>
                <p className="mt-2 flex items-center gap-1 text-3xl font-semibold text-slate-900">
                  <CircleDollarSign size={22} className="text-primary" />
                  {Number(crmSummary?.pipelineValue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </Card>
            </div>

            <Card className="rounded-3xl border border-slate-100 bg-white p-4 shadow-none">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="grid gap-1">
                  <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">Etapa do negócio</Label>
                  <Select value={crmDealStageFilter} onValueChange={(value) => {
                    setCrmDealStageFilter(value)
                    updateCrmFiltersInUrl({ dealStage: value })
                  }}>
                    <SelectTrigger className="h-9 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                      <SelectItem value="ALL">Todas</SelectItem>
                      <SelectItem value="LEAD">Lead</SelectItem>
                      <SelectItem value="CONTACT">Contato</SelectItem>
                      <SelectItem value="PROPOSAL">Proposta</SelectItem>
                      <SelectItem value="NEGOTIATION">Negociação</SelectItem>
                      <SelectItem value="WON">Ganho</SelectItem>
                      <SelectItem value="LOST">Perdido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">Status da tarefa</Label>
                  <Select value={crmTaskStatusFilter} onValueChange={(value) => {
                    setCrmTaskStatusFilter(value)
                    updateCrmFiltersInUrl({ taskStatus: value })
                  }}>
                    <SelectTrigger className="h-9 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                      <SelectItem value="ALL">Todos</SelectItem>
                      <SelectItem value="OPEN">Aberta</SelectItem>
                      <SelectItem value="IN_PROGRESS">Em andamento</SelectItem>
                      <SelectItem value="DONE">Concluída</SelectItem>
                      <SelectItem value="CANCELED">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">Período</Label>
                  <Select value={crmPeriodFilter} onValueChange={(value) => {
                    setCrmPeriodFilter(value)
                    updateCrmFiltersInUrl({ period: value })
                  }}>
                    <SelectTrigger className="h-9 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                      <SelectItem value="ALL">Todo período</SelectItem>
                      <SelectItem value="7">Últimos 7 dias</SelectItem>
                      <SelectItem value="30">Últimos 30 dias</SelectItem>
                      <SelectItem value="90">Últimos 90 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            <div className="overflow-x-auto rounded-[2rem] border border-slate-100 bg-white p-4">
              <div className="grid min-w-[1100px] grid-cols-6 gap-3">
                {crmStagesOrder.map((stage) => (
                  <div
                    key={stage}
                    className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropDealOnStage(stage)}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{crmDealStageLabels[stage]}</p>
                      <Badge variant="outline" className="rounded-lg text-[10px]">{groupedDealsByStage[stage]?.length || 0}</Badge>
                    </div>
                    <div className="space-y-2">
                      {(groupedDealsByStage[stage] || []).map((deal) => (
                        <button
                          key={deal.id}
                          type="button"
                          draggable
                          onDragStart={() => setDraggingDealId(deal.id)}
                          onDragEnd={() => setDraggingDealId(null)}
                          onDoubleClick={() => {
                            setEditingDeal({
                              ...deal,
                              value: String(deal.value ?? 0),
                              expectedCloseDate: deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().split("T")[0] : "",
                            });
                            setIsEditDealDialogOpen(true);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white p-2 text-left transition hover:border-primary/40"
                        >
                          <p className="truncate text-sm font-semibold text-slate-800">{deal.title}</p>
                          <p className="mt-1 text-[11px] text-slate-500">{deal?.client?.name || '-'}</p>
                          <p className="text-[11px] font-medium text-primary">
                            {Number(deal.value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white xl:col-span-2">
                <div className="border-b border-slate-100 p-5">
                  <h3 className="text-lg font-semibold text-slate-900">Negócios</h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-none bg-slate-50/70">
                      <TableHead className={`px-6 ${tableHeadBaseClass}`}>Título</TableHead>
                      <TableHead className={tableHeadBaseClass}>Cliente</TableHead>
                      <TableHead className={tableHeadBaseClass}>Valor</TableHead>
                      <TableHead className={tableHeadBaseClass}>Etapa</TableHead>
                      <TableHead className={`px-6 text-right ${tableHeadBaseClass}`}>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {crmLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-slate-400">Carregando negócios...</TableCell>
                      </TableRow>
                    ) : filteredCrmDeals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-slate-400">Nenhum negócio cadastrado.</TableCell>
                      </TableRow>
                    ) : (
                      filteredCrmDeals.map((deal) => (
                        <TableRow key={deal.id} className="border-slate-50 transition-colors hover:bg-slate-50/50">
                          <TableCell className={`${tableCellBaseClass} px-6`}>
                            <div className="font-semibold text-slate-900">{deal.title}</div>
                            {deal.source && <div className="text-xs text-slate-500">Origem: {deal.source}</div>}
                          </TableCell>
                          <TableCell className={tableCellBaseClass}>{deal?.client?.name || '-'}</TableCell>
                          <TableCell className={tableCellBaseClass}>
                            {Number(deal.value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </TableCell>
                          <TableCell className={tableCellBaseClass}>
                            <Select value={deal.stage} onValueChange={(value) => handleDealStageChange(deal, value)}>
                              <SelectTrigger className="h-9 rounded-xl"><SelectValue /></SelectTrigger>
                              <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                                <SelectItem value="LEAD">Lead</SelectItem>
                                <SelectItem value="CONTACT">Contato</SelectItem>
                                <SelectItem value="PROPOSAL">Proposta</SelectItem>
                                <SelectItem value="NEGOTIATION">Negociação</SelectItem>
                                <SelectItem value="WON">Ganho</SelectItem>
                                <SelectItem value="LOST">Perdido</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className={`${tableCellBaseClass} px-6 text-right`}>
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setEditingDeal({
                                    ...deal,
                                    value: String(deal.value ?? 0),
                                    expectedCloseDate: deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().split("T")[0] : "",
                                  });
                                  setIsEditDealDialogOpen(true);
                                }}
                              >
                                <Edit3 size={18} className="text-primary" />
                              </Button>
                              <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDeleteDeal(deal.id)}>
                                <Trash2 size={18} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white">
                <div className="border-b border-slate-100 p-5">
                  <h3 className="text-lg font-semibold text-slate-900">Interações recentes</h3>
                </div>
                <div className="max-h-[420px] space-y-3 overflow-y-auto p-5">
                  {filteredCrmActivities.length === 0 ? (
                    <p className="text-sm text-slate-400">Nenhuma interação registrada.</p>
                  ) : (
                    filteredCrmActivities.map((activity) => (
                      <div key={activity.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <Badge variant="outline" className="rounded-lg text-[11px]">
                            {activity.type}
                          </Badge>
                          <span className="text-[11px] text-slate-500">
                            {new Date(activity.createdAt).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700">{activity.content}</p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {activity?.client?.name ? `Cliente: ${activity.client.name}` : ''}
                          {activity?.deal?.title ? ` ${activity?.client?.name ? '•' : ''} Negócio: ${activity.deal.title}` : ''}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white">
              <div className="border-b border-slate-100 p-5">
                <h3 className="text-lg font-semibold text-slate-900">Tarefas</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-none bg-slate-50/70">
                    <TableHead className={`px-8 ${tableHeadBaseClass}`}>Tarefa</TableHead>
                    <TableHead className={tableHeadBaseClass}>Vínculo</TableHead>
                    <TableHead className={tableHeadBaseClass}>Prazo</TableHead>
                    <TableHead className={tableHeadBaseClass}>Status</TableHead>
                    <TableHead className={`px-8 text-right ${tableHeadBaseClass}`}>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCrmTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-slate-400">Nenhuma tarefa cadastrada.</TableCell>
                    </TableRow>
                  ) : (
                    filteredCrmTasks.map((task) => (
                      <TableRow key={task.id} className="border-slate-50 transition-colors hover:bg-slate-50/50">
                        <TableCell className={`${tableCellBaseClass} px-8`}>
                          <div className="font-semibold text-slate-900">{task.title}</div>
                          {task.description && <div className="text-xs text-slate-500">{task.description}</div>}
                        </TableCell>
                        <TableCell className={tableCellBaseClass}>
                          <div className="text-sm text-slate-700">{task?.client?.name || '-'}</div>
                          {task?.deal?.title && <div className="text-xs text-slate-500">{task.deal.title}</div>}
                        </TableCell>
                        <TableCell className={tableCellBaseClass}>
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : '-'}
                        </TableCell>
                        <TableCell className={tableCellBaseClass}>
                          <Select value={task.status} onValueChange={(value) => handleTaskStatusChange(task, value)}>
                            <SelectTrigger className="h-9 rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                              <SelectItem value="OPEN">Aberta</SelectItem>
                              <SelectItem value="IN_PROGRESS">Em andamento</SelectItem>
                              <SelectItem value="DONE">Concluída</SelectItem>
                              <SelectItem value="CANCELED">Cancelada</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className={`${tableCellBaseClass} px-8 text-right`}>
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingTask({
                                  ...task,
                                  dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
                                  clientId: task.clientId || "",
                                  dealId: task.dealId || "",
                                });
                                setIsEditTaskDialogOpen(true);
                              }}
                            >
                              <Edit3 size={18} className="text-primary" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDeleteTask(task.id)}>
                              <Trash2 size={18} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-8">
            <Card className="rounded-3xl border border-slate-100 bg-white p-6 shadow-none">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Criar conta de acesso</h2>
              <form className="grid md:grid-cols-4 gap-4" onSubmit={handleCreateUser}>
                <Input
                  className="rounded-xl"
                  placeholder="Nome"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
                <Input
                  className="rounded-xl"
                  type="email"
                  placeholder="E-mail"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
                <Input
                  className="rounded-xl"
                  type="password"
                  placeholder="Senha inicial"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
                <div className="flex gap-2">
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                      <SelectItem value="RECEPTION">Recepção</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="submit" className="rounded-xl" disabled={creatingUser}>
                    {creatingUser ? "Criando..." : "Criar"}
                  </Button>
                </div>
              </form>
            </Card>

            <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="border-none bg-slate-50/70">
                    <TableHead className={`px-8 ${tableHeadBaseClass}`}>Usuário</TableHead>
                    <TableHead className={tableHeadBaseClass}>Perfil</TableHead>
                    <TableHead className={tableHeadBaseClass}>Situação</TableHead>
                    <TableHead className={`px-8 text-right ${tableHeadBaseClass}`}>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-slate-400">Carregando usuários...</TableCell>
                    </TableRow>
                  ) : adminUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-slate-400">Nenhum usuário cadastrado.</TableCell>
                    </TableRow>
                  ) : (
                    adminUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                        <TableCell className={`${tableCellBaseClass} px-8`}>
                          <div className="font-bold text-slate-900">{user.name}</div>
                          <div className="text-xs text-slate-400">{user.email}</div>
                        </TableCell>
                        <TableCell className={tableCellBaseClass}>
                          <Select value={user.role} onValueChange={(value) => handleChangeUserRole(user, value as "ADMIN" | "RECEPTION")}>
                            <SelectTrigger className="rounded-xl max-w-[160px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                              <SelectItem value="RECEPTION">Recepção</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className={tableCellBaseClass}>
                          <Badge className={`rounded-lg px-3 py-1 font-bold ${user.isActive ? 'bg-primary' : 'bg-slate-500'}`}>
                            {user.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className={`${tableCellBaseClass} px-8 text-right`}>
                          <Button variant="outline" className="rounded-xl" onClick={() => handleToggleUserActive(user)}>
                            {user.isActive ? 'Desativar' : 'Ativar'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-0 shadow-lg sm:max-w-[520px]">
            <DialogHeader>
              <div className="border-b border-slate-100 px-6 py-5">
                <DialogTitle className="text-xl font-semibold text-slate-900">Editar Registro</DialogTitle>
                <DialogDescription className="mt-1 text-sm text-slate-500">
                  Atualize os dados e salve para aplicar as mudanças.
                </DialogDescription>
              </div>
            </DialogHeader>
            {editingItem && (
              <form onSubmit={handleUpdate} className="space-y-4 px-6 py-5">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" className="rounded-xl" value={editingItem.name || ""} onChange={(e) => setEditingItem({...editingItem, name: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" className="rounded-xl" value={editingItem.email || ""} onChange={(e) => setEditingItem({...editingItem, email: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" className="rounded-xl" value={editingItem.phone || ""} onChange={(e) => setEditingItem({...editingItem, phone: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={editingItem.status} onValueChange={(val) => setEditingItem({...editingItem, status: val})}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                      {activeTab === "bookings" ? (
                        <>
                          <SelectItem value="PENDING">Pendente</SelectItem>
                          <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                          <SelectItem value="CANCELLED">Cancelado</SelectItem>
                          <SelectItem value="COMPLETED">Concluído</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="NEW">Novo</SelectItem>
                          <SelectItem value="CONTACTED">Contatado</SelectItem>
                          <SelectItem value="QUALIFIED">Qualificado</SelectItem>
                          <SelectItem value="LOST">Perdido</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="border-t border-slate-100 pt-4">
                  <Button type="submit" className="w-full rounded-xl font-semibold">Salvar Alterações</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-0 shadow-lg sm:max-w-[620px]">
            <DialogHeader>
              <div className="border-b border-slate-100 px-6 py-5">
                <DialogTitle className="text-xl font-semibold text-slate-900">Novo Agendamento Manual</DialogTitle>
                <DialogDescription className="mt-1 text-sm text-slate-500">
                  Registre uma reserva manual e sincronize com a operação.
                </DialogDescription>
              </div>
            </DialogHeader>

            <form onSubmit={handleCreateManualBooking} className="space-y-4 px-6 py-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Nome</Label>
                  <Input className="rounded-xl" value={newBooking.name} onChange={(e) => setNewBooking({ ...newBooking, name: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>E-mail</Label>
                  <Input className="rounded-xl" type="email" value={newBooking.email} onChange={(e) => setNewBooking({ ...newBooking, email: e.target.value })} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Telefone</Label>
                  <Input className="rounded-xl" value={newBooking.phone} onChange={(e) => setNewBooking({ ...newBooking, phone: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Sala</Label>
                  <Select value={newBooking.room} onValueChange={(value) => setNewBooking({ ...newBooking, room: value })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                      <SelectItem value="reuniao">Sala de Reunião</SelectItem>
                      <SelectItem value="treinamento">Sala de Treinamento</SelectItem>
                      <SelectItem value="coworking">Coworking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Data</Label>
                  <Input className="rounded-xl" type="date" value={newBooking.date} onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Horário</Label>
                  <Input className="rounded-xl" type="time" value={newBooking.time} onChange={(e) => setNewBooking({ ...newBooking, time: e.target.value })} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Origem</Label>
                  <Select value={newBooking.source} onValueChange={(value) => setNewBooking({ ...newBooking, source: value })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={newBooking.status} onValueChange={(value) => setNewBooking({ ...newBooking, status: value })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                      <SelectItem value="PENDING">Pendente</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                      <SelectItem value="CANCELLED">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Observações</Label>
                <Input className="rounded-xl" value={newBooking.notes} onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })} placeholder="Opcional" />
              </div>

              <DialogFooter className="border-t border-slate-100 pt-4">
                <Button type="submit" className="w-full rounded-xl font-semibold" disabled={creatingBooking}>
                  {creatingBooking ? "Salvando..." : "Salvar agendamento manual"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isCreateClientDialogOpen} onOpenChange={setIsCreateClientDialogOpen}>
          <DialogContent className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-0 shadow-lg sm:max-w-[680px]">
            <DialogHeader>
              <div className="border-b border-slate-100 px-6 py-5">
                <DialogTitle className="text-xl font-semibold text-slate-900">Novo Cliente</DialogTitle>
                <DialogDescription className="mt-1 text-sm text-slate-500">
                  Cadastre o cliente e vincule automaticamente reservas com o mesmo e-mail.
                </DialogDescription>
              </div>
            </DialogHeader>

            <form onSubmit={handleCreateClient} className="space-y-4 px-6 py-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Nome completo</Label>
                  <Input value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} className="rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select value={newClient.type} onValueChange={(value) => {
                    setNewClient((prev) => ({
                      ...prev,
                      type: value,
                      cpf: value === "PF" ? prev.cpf : "",
                      cnpj: value === "PJ" ? prev.cnpj : "",
                    }));
                  }}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                      <SelectItem value="PF">Pessoa Física</SelectItem>
                      <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>E-mail</Label>
                  <Input type="email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} className="rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label>Telefone</Label>
                  <Input value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} className="rounded-xl" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>WhatsApp</Label>
                  <Input value={newClient.whatsapp} onChange={(e) => setNewClient({ ...newClient, whatsapp: e.target.value })} className="rounded-xl" />
                </div>
                {newClient.type === "PF" ? (
                  <div className="grid gap-2">
                    <Label>CPF</Label>
                    <Input value={newClient.cpf} onChange={(e) => setNewClient({ ...newClient, cpf: e.target.value })} className="rounded-xl" />
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Label>CNPJ</Label>
                    <Input value={newClient.cnpj} onChange={(e) => setNewClient({ ...newClient, cnpj: e.target.value })} className="rounded-xl" />
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Data de nascimento</Label>
                  <Input type="date" value={newClient.birthDate} onChange={(e) => setNewClient({ ...newClient, birthDate: e.target.value })} className="rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label>Endereço</Label>
                  <Input value={newClient.address} onChange={(e) => setNewClient({ ...newClient, address: e.target.value })} className="rounded-xl" />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Observações internas</Label>
                <Input value={newClient.notes} onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })} className="rounded-xl" />
              </div>

              <DialogFooter className="border-t border-slate-100 pt-4">
                <Button type="submit" className="w-full rounded-xl font-semibold" disabled={creatingClient}>
                  {creatingClient ? "Salvando..." : "Salvar cliente"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditClientDialogOpen} onOpenChange={setIsEditClientDialogOpen}>
          <DialogContent className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-0 shadow-lg sm:max-w-[680px]">
            <DialogHeader>
              <div className="border-b border-slate-100 px-6 py-5">
                <DialogTitle className="text-xl font-semibold text-slate-900">Editar Cliente</DialogTitle>
                <DialogDescription className="mt-1 text-sm text-slate-500">
                  Altere os dados do cliente. O vínculo por e-mail será atualizado automaticamente.
                </DialogDescription>
              </div>
            </DialogHeader>

            {editingClient && (
              <form onSubmit={handleUpdateClient} className="space-y-4 px-6 py-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Nome completo</Label>
                    <Input value={editingClient.name || ""} onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })} className="rounded-xl" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Tipo</Label>
                    <Select value={editingClient.type || "PF"} onValueChange={(value) => {
                      setEditingClient((prev: any) => ({
                        ...prev,
                        type: value,
                        cpf: value === "PF" ? (prev?.cpf || "") : "",
                        cnpj: value === "PJ" ? (prev?.cnpj || "") : "",
                      }));
                    }}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                        <SelectItem value="PF">Pessoa Física</SelectItem>
                        <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>E-mail</Label>
                    <Input type="email" value={editingClient.email || ""} onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })} className="rounded-xl" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Telefone</Label>
                    <Input value={editingClient.phone || ""} onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })} className="rounded-xl" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>WhatsApp</Label>
                    <Input value={editingClient.whatsapp || ""} onChange={(e) => setEditingClient({ ...editingClient, whatsapp: e.target.value })} className="rounded-xl" />
                  </div>
                  {(editingClient.type || "PF") === "PF" ? (
                    <div className="grid gap-2">
                      <Label>CPF</Label>
                      <Input value={editingClient.cpf || ""} onChange={(e) => setEditingClient({ ...editingClient, cpf: e.target.value })} className="rounded-xl" />
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <Label>CNPJ</Label>
                      <Input value={editingClient.cnpj || ""} onChange={(e) => setEditingClient({ ...editingClient, cnpj: e.target.value })} className="rounded-xl" />
                    </div>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Data de nascimento</Label>
                    <Input type="date" value={editingClient.birthDate || ""} onChange={(e) => setEditingClient({ ...editingClient, birthDate: e.target.value })} className="rounded-xl" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Endereço</Label>
                    <Input value={editingClient.address || ""} onChange={(e) => setEditingClient({ ...editingClient, address: e.target.value })} className="rounded-xl" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Observações internas</Label>
                  <Input value={editingClient.notes || ""} onChange={(e) => setEditingClient({ ...editingClient, notes: e.target.value })} className="rounded-xl" />
                </div>

                <DialogFooter className="border-t border-slate-100 pt-4">
                  <Button type="submit" className="w-full rounded-xl font-semibold" disabled={updatingClient}>
                    {updatingClient ? "Salvando..." : "Salvar alterações"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isCreateDealDialogOpen} onOpenChange={setIsCreateDealDialogOpen}>
          <DialogContent className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-0 shadow-lg sm:max-w-[620px]">
            <DialogHeader>
              <div className="border-b border-slate-100 px-6 py-5">
                <DialogTitle className="text-xl font-semibold text-slate-900">Novo Negócio</DialogTitle>
                <DialogDescription className="mt-1 text-sm text-slate-500">
                  Adicione uma oportunidade no pipeline comercial.
                </DialogDescription>
              </div>
            </DialogHeader>

            <form onSubmit={handleCreateDeal} className="space-y-4 px-6 py-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Título</Label>
                  <Input className="rounded-xl" value={newDeal.title} onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Cliente</Label>
                  <Select value={newDeal.clientId} onValueChange={(value) => setNewDeal({ ...newDeal, clientId: value })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Valor</Label>
                  <Input type="number" min="0" step="0.01" className="rounded-xl" value={newDeal.value} onChange={(e) => setNewDeal({ ...newDeal, value: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Etapa</Label>
                  <Select value={newDeal.stage} onValueChange={(value) => setNewDeal({ ...newDeal, stage: value })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                      <SelectItem value="LEAD">Lead</SelectItem>
                      <SelectItem value="CONTACT">Contato</SelectItem>
                      <SelectItem value="PROPOSAL">Proposta</SelectItem>
                      <SelectItem value="NEGOTIATION">Negociação</SelectItem>
                      <SelectItem value="WON">Ganho</SelectItem>
                      <SelectItem value="LOST">Perdido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Fechamento previsto</Label>
                  <Input type="date" className="rounded-xl" value={newDeal.expectedCloseDate} onChange={(e) => setNewDeal({ ...newDeal, expectedCloseDate: e.target.value })} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Origem</Label>
                  <Input className="rounded-xl" value={newDeal.source} onChange={(e) => setNewDeal({ ...newDeal, source: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Descrição</Label>
                  <Input className="rounded-xl" value={newDeal.description} onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })} />
                </div>
              </div>

              <DialogFooter className="border-t border-slate-100 pt-4">
                <Button type="submit" className="w-full rounded-xl font-semibold" disabled={creatingDeal}>
                  {creatingDeal ? 'Salvando...' : 'Salvar negócio'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isCreateTaskDialogOpen} onOpenChange={setIsCreateTaskDialogOpen}>
          <DialogContent className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-0 shadow-lg sm:max-w-[620px]">
            <DialogHeader>
              <div className="border-b border-slate-100 px-6 py-5">
                <DialogTitle className="text-xl font-semibold text-slate-900">Nova Tarefa</DialogTitle>
                <DialogDescription className="mt-1 text-sm text-slate-500">
                  Crie uma tarefa vinculada a cliente ou negócio.
                </DialogDescription>
              </div>
            </DialogHeader>

            <form onSubmit={handleCreateTask} className="space-y-4 px-6 py-5">
              <div className="grid gap-2">
                <Label>Título</Label>
                <Input className="rounded-xl" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Cliente</Label>
                  <Select value={newTask.clientId} onValueChange={(value) => setNewTask({ ...newTask, clientId: value })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Negócio</Label>
                  <Select value={newTask.dealId} onValueChange={(value) => setNewTask({ ...newTask, dealId: value })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                      {crmDeals.map((deal) => (
                        <SelectItem key={deal.id} value={deal.id}>{deal.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Prazo</Label>
                  <Input type="date" className="rounded-xl" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={newTask.status} onValueChange={(value) => setNewTask({ ...newTask, status: value })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                      <SelectItem value="OPEN">Aberta</SelectItem>
                      <SelectItem value="IN_PROGRESS">Em andamento</SelectItem>
                      <SelectItem value="DONE">Concluída</SelectItem>
                      <SelectItem value="CANCELED">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Prioridade</Label>
                  <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                      <SelectItem value="LOW">Baixa</SelectItem>
                      <SelectItem value="MEDIUM">Média</SelectItem>
                      <SelectItem value="HIGH">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Descrição</Label>
                <Input className="rounded-xl" value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
              </div>

              <DialogFooter className="border-t border-slate-100 pt-4">
                <Button type="submit" className="w-full rounded-xl font-semibold" disabled={creatingTask}>
                  {creatingTask ? 'Salvando...' : 'Salvar tarefa'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isCreateActivityDialogOpen} onOpenChange={setIsCreateActivityDialogOpen}>
          <DialogContent className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-0 shadow-lg sm:max-w-[620px]">
            <DialogHeader>
              <div className="border-b border-slate-100 px-6 py-5">
                <DialogTitle className="text-xl font-semibold text-slate-900">Nova Interação</DialogTitle>
                <DialogDescription className="mt-1 text-sm text-slate-500">
                  Registre histórico de contato com cliente ou oportunidade.
                </DialogDescription>
              </div>
            </DialogHeader>

            <form onSubmit={handleCreateActivity} className="space-y-4 px-6 py-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select value={newActivity.type} onValueChange={(value) => setNewActivity({ ...newActivity, type: value })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                      <SelectItem value="NOTE">Nota</SelectItem>
                      <SelectItem value="CALL">Ligação</SelectItem>
                      <SelectItem value="MEETING">Reunião</SelectItem>
                      <SelectItem value="EMAIL">E-mail</SelectItem>
                      <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Cliente</Label>
                  <Select value={newActivity.clientId} onValueChange={(value) => setNewActivity({ ...newActivity, clientId: value })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Negócio</Label>
                  <Select value={newActivity.dealId} onValueChange={(value) => setNewActivity({ ...newActivity, dealId: value })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                      {crmDeals.map((deal) => (
                        <SelectItem key={deal.id} value={deal.id}>{deal.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Descrição da interação</Label>
                <Input className="rounded-xl" value={newActivity.content} onChange={(e) => setNewActivity({ ...newActivity, content: e.target.value })} />
              </div>

              <DialogFooter className="border-t border-slate-100 pt-4">
                <Button type="submit" className="w-full rounded-xl font-semibold" disabled={creatingActivity}>
                  {creatingActivity ? 'Salvando...' : 'Salvar interação'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDealDialogOpen} onOpenChange={setIsEditDealDialogOpen}>
          <DialogContent className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-0 shadow-lg sm:max-w-[620px]">
            <DialogHeader>
              <div className="border-b border-slate-100 px-6 py-5">
                <DialogTitle className="text-xl font-semibold text-slate-900">Editar Negócio</DialogTitle>
                <DialogDescription className="mt-1 text-sm text-slate-500">
                  Atualize os dados completos da oportunidade.
                </DialogDescription>
              </div>
            </DialogHeader>

            {editingDeal && (
              <form onSubmit={handleUpdateDeal} className="space-y-4 px-6 py-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Título</Label>
                    <Input className="rounded-xl" value={editingDeal.title || ""} onChange={(e) => setEditingDeal({ ...editingDeal, title: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Cliente</Label>
                    <Select value={editingDeal.clientId || ""} onValueChange={(value) => setEditingDeal({ ...editingDeal, clientId: value })}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label>Valor</Label>
                    <Input type="number" min="0" step="0.01" className="rounded-xl" value={editingDeal.value || "0"} onChange={(e) => setEditingDeal({ ...editingDeal, value: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Etapa</Label>
                    <Select value={editingDeal.stage || "LEAD"} onValueChange={(value) => setEditingDeal({ ...editingDeal, stage: value })}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                        <SelectItem value="LEAD">Lead</SelectItem>
                        <SelectItem value="CONTACT">Contato</SelectItem>
                        <SelectItem value="PROPOSAL">Proposta</SelectItem>
                        <SelectItem value="NEGOTIATION">Negociação</SelectItem>
                        <SelectItem value="WON">Ganho</SelectItem>
                        <SelectItem value="LOST">Perdido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Fechamento previsto</Label>
                    <Input type="date" className="rounded-xl" value={editingDeal.expectedCloseDate || ""} onChange={(e) => setEditingDeal({ ...editingDeal, expectedCloseDate: e.target.value })} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Origem</Label>
                    <Input className="rounded-xl" value={editingDeal.source || ""} onChange={(e) => setEditingDeal({ ...editingDeal, source: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Descrição</Label>
                    <Input className="rounded-xl" value={editingDeal.description || ""} onChange={(e) => setEditingDeal({ ...editingDeal, description: e.target.value })} />
                  </div>
                </div>

                <DialogFooter className="border-t border-slate-100 pt-4">
                  <Button type="submit" className="w-full rounded-xl font-semibold" disabled={updatingDeal}>
                    {updatingDeal ? 'Salvando...' : 'Salvar alterações'}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isEditTaskDialogOpen} onOpenChange={setIsEditTaskDialogOpen}>
          <DialogContent className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-0 shadow-lg sm:max-w-[620px]">
            <DialogHeader>
              <div className="border-b border-slate-100 px-6 py-5">
                <DialogTitle className="text-xl font-semibold text-slate-900">Editar Tarefa</DialogTitle>
                <DialogDescription className="mt-1 text-sm text-slate-500">
                  Atualize os dados completos da tarefa.
                </DialogDescription>
              </div>
            </DialogHeader>

            {editingTask && (
              <form onSubmit={handleUpdateTask} className="space-y-4 px-6 py-5">
                <div className="grid gap-2">
                  <Label>Título</Label>
                  <Input className="rounded-xl" value={editingTask.title || ""} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Cliente</Label>
                    <Select value={editingTask.clientId || ""} onValueChange={(value) => setEditingTask({ ...editingTask, clientId: value })}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Opcional" /></SelectTrigger>
                      <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Negócio</Label>
                    <Select value={editingTask.dealId || ""} onValueChange={(value) => setEditingTask({ ...editingTask, dealId: value })}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Opcional" /></SelectTrigger>
                      <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                        {crmDeals.map((deal) => (
                          <SelectItem key={deal.id} value={deal.id}>{deal.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label>Prazo</Label>
                    <Input type="date" className="rounded-xl" value={editingTask.dueDate || ""} onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select value={editingTask.status || "OPEN"} onValueChange={(value) => setEditingTask({ ...editingTask, status: value })}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                        <SelectItem value="OPEN">Aberta</SelectItem>
                        <SelectItem value="IN_PROGRESS">Em andamento</SelectItem>
                        <SelectItem value="DONE">Concluída</SelectItem>
                        <SelectItem value="CANCELED">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Prioridade</Label>
                    <Select value={editingTask.priority || "MEDIUM"} onValueChange={(value) => setEditingTask({ ...editingTask, priority: value })}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="z-50 rounded-xl border border-slate-200 bg-white shadow-lg">
                        <SelectItem value="LOW">Baixa</SelectItem>
                        <SelectItem value="MEDIUM">Média</SelectItem>
                        <SelectItem value="HIGH">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Descrição</Label>
                  <Input className="rounded-xl" value={editingTask.description || ""} onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })} />
                </div>

                <DialogFooter className="border-t border-slate-100 pt-4">
                  <Button type="submit" className="w-full rounded-xl font-semibold" disabled={updatingTask}>
                    {updatingTask ? 'Salvando...' : 'Salvar alterações'}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </main>
      </div>
    </div>
  );
};

export default function AdminPage() {
  return <AdminDashboard />
}