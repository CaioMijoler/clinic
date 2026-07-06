export class ConfirmationPreviewDto {
  attendance: {
    appointmentId: string;
    patientName: string;
    appointmentDate: string;
    appointmentTime: string;
    doctorName: string;
    specialty: string;
  };
  status: 'pending' | 'confirmed' | 'cancelled';
}
