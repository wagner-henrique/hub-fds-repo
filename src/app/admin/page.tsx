"use client";

import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Users, 
  Settings,
  CheckCircle2,
  XCircle,
  Trash2,
  Mail,
  Phone,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showSuccess, showError } from '@/utils/toast';

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, leadsRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/leads')
      ]);
      const bookingsData = await bookingsRes.json();
      const leadsData = await leadsRes.json();
      setBookings(bookingsData);
      setLeads(leadsData);
    } catch (error) {
      showError("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateBookingStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showSuccess(`Status atualizado para ${status}`);
        fetchData();
      }
    } catch (error) {
      showError("Erro ao atualizar status.");
    }
  };

  const deleteBooking = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este agendamento?")) return;
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showSuccess("Agendamento removido.");
        fetchData();
      }
    } catch (error) {
      showError("Erro ao excluir.");
    }
  };

  return (
    <div className="min-h-screen bg-secondary/10 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-primary/10 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold">H</div>
          <span className="font-bold text-xl text-primary">HUB Admin</span>
        </div>

        <nav className="space-y-2">
          <Button 
            variant={activeTab === "dashboard" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3"
            onClick={() => setActiveTab("dashboard")}
          >
            <LayoutDashboard size={20} /> Dashboard
          </Button>
          <Button 
            variant={activeTab === "bookings" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3"
            onClick={() => setActiveTab("bookings")}
          >
            <CalendarIcon size={20} /> Agendamentos
          </Button>
          <Button 
            variant={activeTab === "leads" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3"
            onClick={() => setActiveTab("leads")}
          >
            <Users size={20} /> Leads
          </Button>
          <Button 
            variant={activeTab === "settings" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3 mt-auto"
            onClick={() => setActiveTab("settings")}
          >
            <Settings size={20} /> Configurações
          </Button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold capitalize">{activeTab}</h1>
            <p className="text-muted-foreground">Gerenciamento centralizado do HUB FDS.</p>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">Atualizar Dados</Button>
        </header>

        {activeTab === "dashboard" && (
          <div className="space-y-10">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-primary text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-80">Total de Reservas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{bookings.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Novos Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary">{leads.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Aguardando Confirmação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-orange-500">
                    {bookings.filter(b => b.status === 'pending').length}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-3xl border-none shadow-xl shadow-primary/5">
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings.slice(0, 5).map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary font-bold">
                          {b.name[0]}
                        </div>
                        <div>
                          <p className="font-bold">{b.name}</p>
                          <p className="text-xs text-muted-foreground">{b.time} - {new Date(b.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Badge variant={b.status === 'confirmed' ? 'default' : 'secondary'}>{b.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "bookings" && (
          <Card className="rounded-3xl overflow-hidden border-none shadow-xl shadow-primary/5">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/20">
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking: any) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="font-medium">{booking.name}</div>
                        <div className="text-xs text-muted-foreground">{booking.email}</div>
                      </TableCell>
                      <TableCell>
                        <div>{new Date(booking.date).toLocaleDateString('pt-BR')}</div>
                        <div className="text-xs font-bold text-primary">{booking.time}</div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            booking.status === 'confirmed' ? 'bg-green-500' : 
                            booking.status === 'cancelled' ? 'bg-red-500' : 'bg-orange-500'
                          }
                        >
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => updateBookingStatus(booking.id, 'confirmed')} className="text-green-600">
                            <CheckCircle2 size={18} />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => updateBookingStatus(booking.id, 'cancelled')} className="text-orange-600">
                            <XCircle size={18} />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteBooking(booking.id)} className="text-red-600">
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {activeTab === "leads" && (
          <Card className="rounded-3xl overflow-hidden border-none shadow-xl shadow-primary/5">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/20">
                    <TableHead>Lead</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead className="text-right">Contato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead: any) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="font-medium">{lead.name || 'Sem nome'}</div>
                        <div className="text-xs text-muted-foreground">{lead.email}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{lead.source}</Badge></TableCell>
                      <TableCell>{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <a href={`mailto:${lead.email}`}><Button size="icon" variant="ghost"><Mail size={18} /></Button></a>
                          <Button size="icon" variant="ghost"><Phone size={18} /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {activeTab === "settings" && (
          <div className="max-w-2xl space-y-6">
            <Card>
              <CardHeader><CardTitle>Configurações do Sistema</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-bold">Nome do HUB</label>
                  <input className="p-3 rounded-xl border bg-secondary/20" defaultValue="HUB FDS - Fábrica de Sonhos" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-bold">E-mail de Notificação</label>
                  <input className="p-3 rounded-xl border bg-secondary/20" defaultValue="contato@hubfds.br" />
                </div>
                <Button className="w-full">Salvar Alterações</Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;