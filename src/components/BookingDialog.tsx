"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import BookingForm from './BookingForm';

interface BookingDialogProps {
  children: React.ReactNode;
}

const BookingDialog = ({ children }: BookingDialogProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-8 overflow-y-auto max-h-[90vh]">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-3xl font-bold text-primary">Agende sua Visita</DialogTitle>
          <DialogDescription className="text-base">
            Escolha o melhor momento para conhecer o HUB FDS.
          </DialogDescription>
        </DialogHeader>
        <BookingForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;