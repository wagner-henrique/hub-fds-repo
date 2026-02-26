"use client";

import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Users, 
  Settings,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bookings')
      .then(res => res.json())
      .then(data => {
        setBookings(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-secondary/10 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-primary/10 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold">H</div>
          <span className="font-bold text-xl text-primary">HUB Admin</span>
        </div>

        <nav className="space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-3 bg-primary/5 text-primary">
            <LayoutDashboard size={20} /> Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
            <CalendarIcon size={20} /> Agendamentos
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
            <Users size={20} /> Leads
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground mt-auto">
            <Settings size={20} /> Configurações
          </Button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        <header className="mb-10">
          <h1 className="text-3xl font-bold">Visão Geral</h1>
          <p className="text-muted-foreground">Gerencie as reservas e contatos do HUB FDS.</p>
        </header>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Reservas</CardTitle>
              <CalendarIcon className="text-primary" size={20} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookings.length}</div>
              <p className="text-xs text-muted-foreground">+12% em relação ao mês passado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Novos Leads</CardTitle>
              <Users className="text-primary" size={20} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">48</div>
              <p className="text-xs text-muted-foreground">+5 hoje</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <Clock className="text-primary" size={20} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24%</div>
              <p className="text-xs text-muted-foreground">Média de 3.2 dias para fechamento</p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-3xl overflow-hidden border-none shadow-xl shadow-primary/5">
          <CardHeader className="bg-white border-b border-primary/5">
            <CardTitle>Agendamentos Recentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/20 hover:bg-secondary/20">
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10">Carregando...</TableCell></TableRow>
                ) : bookings.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10">Nenhum agendamento encontrado.</TableCell></TableRow>
                ) : (
                  bookings.map((booking: any) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="font-medium">{booking.name}</div>
                        <div className="text-xs text-muted-foreground">{booking.email}</div>
                      </TableCell>
                      <TableCell>{new Date(booking.date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{booking.time}</TableCell>
                      <TableCell>
                        <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                          {booking.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                            <CheckCircle2 size={18} />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <XCircle size={18} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;