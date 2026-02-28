"use client";

import React, { useEffect, useState } from 'react';
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
  LogOut
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from '@/utils/toast';
import { signOut } from 'next-auth/react';

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

const operationalTimeSlots = [
  "08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"
]

const operationalRooms = [
  { id: "reuniao", label: "Sala de Reunião" },
  { id: "treinamento", label: "Sala de Treinamento" },
  { id: "coworking", label: "Coworking" },
]

const AdminDashboard = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
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

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchUsers();
    }
  }, [activeTab]);

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
    <div className="min-h-screen bg-background flex">
      <aside className="w-72 bg-white border-r border-slate-100 p-8 flex flex-col gap-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">H</div>
          <span className="font-bold text-2xl text-primary tracking-tight">HUB Admin</span>
        </div>

        <nav className="space-y-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'bookings', icon: CalendarIcon, label: 'Agendamentos' },
            { id: 'operational', icon: Grid3X3, label: 'Operacional' },
            { id: 'leads', icon: Users, label: 'Leads' },
            { id: 'settings', icon: Settings, label: 'Configurações' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${
                activeTab === item.id 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'text-slate-400 hover:text-primary hover:bg-primary/5'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto">
          <Button
            variant="outline"
            className="w-full rounded-2xl font-bold"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut size={16} className="mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-12 overflow-y-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              {activeTab === "operational" ? "Painel Operacional" : "Visão Geral"}
            </h1>
            <p className="text-slate-400 font-medium">
              {activeTab === "operational"
                ? "Acompanhe ocupação por sala e horário em tempo real."
                : "Gerencie as reservas e contatos do HUB FDS."}
            </p>
          </div>
          {activeTab === "bookings" && (
            <div className="flex items-center gap-2">
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
              <span className="text-sm font-bold px-4">Página {page} de {totalPages}</span>
              <Button 
                variant="outline" 
                size="icon" 
                disabled={page === totalPages} 
                onClick={() => setPage(p => p + 1)}
                className="rounded-xl"
              >
                <ChevronRight size={18} />
              </Button>
            </div>
          )}
        </header>

        {activeTab === "dashboard" && (
          <>
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="border-none shadow-sm rounded-[2rem] p-6 bg-white">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-slate-500 font-bold text-sm mb-1">Total de Reservas</p>
                    <h3 className="text-4xl font-black text-slate-900">{bookings.length}</h3>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-xl text-primary">
                    <CalendarIcon size={24} />
                  </div>
                </div>
                <p className="text-xs text-slate-400 font-bold">Dados da página atual</p>
              </Card>

              <Card className="border-none shadow-sm rounded-[2rem] p-6 bg-white">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-slate-500 font-bold text-sm mb-1">Novos Leads</p>
                    <h3 className="text-4xl font-black text-slate-900">{leads.length}</h3>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-xl text-primary">
                    <Users size={24} />
                  </div>
                </div>
                <p className="text-xs text-slate-400 font-bold">Total captado</p>
              </Card>

              <Card className="border-none shadow-sm rounded-[2rem] p-6 bg-white">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-slate-500 font-bold text-sm mb-1">Taxa de Conversão</p>
                    <h3 className="text-4xl font-black text-slate-900">24%</h3>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-xl text-primary">
                    <Clock size={24} />
                  </div>
                </div>
                <p className="text-xs text-slate-400 font-bold">Média de fechamento</p>
              </Card>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-50 overflow-hidden">
              <div className="p-8 border-b border-slate-50">
                <h2 className="text-2xl font-bold text-slate-900">Agendamentos Recentes</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/30 border-none">
                    <TableHead className="py-6 px-8 text-slate-400 font-bold">Cliente</TableHead>
                    <TableHead className="py-6 text-slate-400 font-bold">Data</TableHead>
                    <TableHead className="py-6 text-slate-400 font-bold">Horário</TableHead>
                    <TableHead className="py-6 text-slate-400 font-bold">Status</TableHead>
                    <TableHead className="py-6 px-8 text-right text-slate-400 font-bold">Ações</TableHead>
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
                        <TableCell className="py-6 px-8">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-xs text-slate-400">{item.email}</div>
                        </TableCell>
                        <TableCell className="py-6 font-medium text-slate-600">
                          {new Date(item.date).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="py-6 font-bold text-primary">
                          {item.time}
                        </TableCell>
                        <TableCell className="py-6">
                          <Badge className={`rounded-lg px-3 py-1 font-bold ${
                            item.status === 'CONFIRMED' ? 'bg-primary' : item.status === 'CANCELLED' ? 'bg-red-500' : 'bg-amber-500'
                          }`}>
                            {bookingStatusLabels[item.status] || item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-6 px-8 text-right">
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
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/30 border-none">
                  <TableHead className="py-6 px-8 text-slate-400 font-bold">Informações</TableHead>
                  <TableHead className="py-6 text-slate-400 font-bold">{activeTab === "bookings" ? "Data/Hora" : "Origem"}</TableHead>
                  <TableHead className="py-6 text-slate-400 font-bold">Status</TableHead>
                  <TableHead className="py-6 px-8 text-right text-slate-400 font-bold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(activeTab === "bookings" ? bookings : leads).map((item: any) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                    <TableCell className="py-6 px-8">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-400">{item.email}</div>
                      {item.phone && <div className="text-[10px] font-bold text-primary flex items-center gap-1 mt-1"><Phone size={10} /> {item.phone}</div>}
                    </TableCell>
                    <TableCell className="py-6">
                      {activeTab === "bookings" ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-600">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                          <span className="text-xs font-bold text-primary">{item.time}</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="rounded-lg">{item.source}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-6">
                      <Badge className={`rounded-lg px-3 py-1 font-bold ${
                        ['CONFIRMED', 'QUALIFIED'].includes(item.status) ? 'bg-primary' : item.status === 'CANCELLED' || item.status === 'LOST' ? 'bg-red-500' : 'bg-amber-500'
                      }`}>
                        {activeTab === "bookings" ? (bookingStatusLabels[item.status] || item.status) : (leadStatusLabels[item.status] || item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
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
            <Card className="border-none shadow-sm rounded-[2rem] p-6 bg-white">
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

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-50 overflow-auto">
              <table className="w-full min-w-[980px]">
                <thead>
                  <tr className="bg-slate-50/30 border-b border-slate-100">
                    <th className="text-left py-5 px-6 text-slate-400 font-bold">Sala / Horário</th>
                    {operationalTimeSlots.map((slot) => (
                      <th key={slot} className="py-5 px-4 text-center text-slate-400 font-bold">{slot}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {operationalRooms.map((room) => (
                    <tr key={room.id} className="border-b border-slate-50">
                      <td className="py-4 px-6 font-bold text-slate-700">{room.label}</td>
                      {operationalTimeSlots.map((slot) => {
                        const booking = findOperationalBooking(room.id, slot)

                        if (!booking) {
                          return (
                            <td key={`${room.id}-${slot}`} className="py-4 px-3 text-center">
                              <Badge variant="outline" className="rounded-lg text-slate-400 border-slate-200">Livre</Badge>
                            </td>
                          )
                        }

                        return (
                          <td key={`${room.id}-${slot}`} className="py-4 px-3 text-center">
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

        {activeTab === "settings" && (
          <div className="space-y-8">
            <Card className="border-none shadow-sm rounded-[2rem] p-6 bg-white">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Criar conta de acesso</h2>
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
                    <SelectContent className="rounded-xl">
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

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/30 border-none">
                    <TableHead className="py-6 px-8 text-slate-400 font-bold">Usuário</TableHead>
                    <TableHead className="py-6 text-slate-400 font-bold">Perfil</TableHead>
                    <TableHead className="py-6 text-slate-400 font-bold">Situação</TableHead>
                    <TableHead className="py-6 px-8 text-right text-slate-400 font-bold">Ações</TableHead>
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
                        <TableCell className="py-6 px-8">
                          <div className="font-bold text-slate-900">{user.name}</div>
                          <div className="text-xs text-slate-400">{user.email}</div>
                        </TableCell>
                        <TableCell className="py-6">
                          <Select value={user.role} onValueChange={(value) => handleChangeUserRole(user, value as "ADMIN" | "RECEPTION")}>
                            <SelectTrigger className="rounded-xl max-w-[160px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="RECEPTION">Recepção</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-6">
                          <Badge className={`rounded-lg px-3 py-1 font-bold ${user.isActive ? 'bg-primary' : 'bg-slate-500'}`}>
                            {user.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-6 px-8 text-right">
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
          <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Editar Registro</DialogTitle>
            </DialogHeader>
            {editingItem && (
              <form onSubmit={handleUpdate} className="space-y-4 py-4">
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
                    <SelectContent className="rounded-xl">
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
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full rounded-xl font-bold">Salvar Alterações</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[520px] rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Novo Agendamento Manual</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateManualBooking} className="space-y-4 py-2">
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
                    <SelectContent className="rounded-xl">
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
                    <SelectContent className="rounded-xl">
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
                    <SelectContent className="rounded-xl">
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

              <DialogFooter className="pt-2">
                <Button type="submit" className="w-full rounded-xl font-bold" disabled={creatingBooking}>
                  {creatingBooking ? "Salvando..." : "Salvar agendamento manual"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminDashboard;