"use client";

import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Users, 
  Settings,
  Trash2,
  Edit3,
  RefreshCw,
  Phone,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from '@/utils/toast';

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, leadsRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/leads')
      ]);
      setBookings(await bookingsRes.json());
      setLeads(await leadsRes.json());
    } catch (error) {
      showError("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = activeTab === "bookings" ? `/api/bookings/${editingItem.id}` : `/api/leads/${editingItem.id}`;
    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem)
      });
      if (res.ok) {
        showSuccess("Registro atualizado!");
        setIsEditDialogOpen(false);
        fetchData();
      }
    } catch (error) {
      showError("Erro ao atualizar.");
    }
  };

  const handleDelete = async (id: string, type: 'bookings' | 'leads') => {
    if (!confirm("Deseja realmente excluir este registro?")) return;
    try {
      const res = await fetch(`/api/${type}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showSuccess("Excluído com sucesso.");
        fetchData();
      }
    } catch (error) {
      showError("Erro ao excluir.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar conforme imagem */}
      <aside className="w-72 bg-white border-r border-slate-100 p-8 flex flex-col gap-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">H</div>
          <span className="font-bold text-2xl text-primary tracking-tight">HUB Admin</span>
        </div>

        <nav className="space-y-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'bookings', icon: CalendarIcon, label: 'Agendamentos' },
            { id: 'leads', icon: Users, label: 'Leads' },
            { id: 'settings', icon: Settings, label: 'Configurações' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${
                activeTab === item.id 
                ? 'bg-accent text-white shadow-lg shadow-accent/20' 
                : 'text-slate-400 hover:text-primary hover:bg-primary/5'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Visão Geral</h1>
          <p className="text-slate-400 font-medium">Gerencie as reservas e contatos do HUB FDS.</p>
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
                <p className="text-xs text-slate-400 font-bold">+12% em relação ao mês passado</p>
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
                <p className="text-xs text-slate-400 font-bold">+5 hoje</p>
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
                <p className="text-xs text-slate-400 font-bold">Média de 3.2 dias para fechamento</p>
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
                            item.status === 'confirmed' ? 'bg-primary' : 'bg-amber-500'
                          }`}>
                            {item.status}
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
                        ['confirmed', 'qualified'].includes(item.status) ? 'bg-primary' : 'bg-amber-500'
                      }`}>
                        {item.status}
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
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="confirmed">Confirmado</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="new">Novo</SelectItem>
                          <SelectItem value="contacted">Contatado</SelectItem>
                          <SelectItem value="qualified">Qualificado</SelectItem>
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
      </main>
    </div>
  );
};

export default AdminDashboard;