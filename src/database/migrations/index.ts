import { Users1714602960508 } from './1714602960508-users';
import { Clients1714602978514 } from './1714602978514-clients';
import { MedicalRecord1728170882520 } from './1728170882520-medical-record';
import { Pathologies1728171159644 } from './1728171159644-pathologies';
import { Treatment1728171322002 } from './1728171322002-treatment';
import { Questions1728180646238 } from './1728180646238-questions';
import { Feedback1728763238534 } from './1728763238534-feedback';
import { MedicalRecordPathologies1728764877475 } from './1728764877475-medical-record-pathologies';
import { MedicalRecordQuestions1728764903649 } from './1728764903649-medical-record-questions';
import { ClientAddress1733775454390 } from './1733775454390-client-address';
import { AddReminderSentAt1745343600000 } from './1745343600000-add-reminder-sent-at';
import { UpdateUserCredentials1745539600000 } from './1745539600000-update-user-credentials';
import { MedicalRecordDocuments1745914800000 } from './1745914800000-medical-record-documents';
import { RemoveGoogleCalendarColumns1746000000000 } from './1746000000000-remove-google-calendar-columns';
import { Notification1746845668000 } from './1746845668000-notification';
import { ServicesAndMedicalRecordServices1747000000000 } from './1747000000000-services-and-medical-record-services';
import { MedicalRecordTotalValue1747000000001 } from './1747000000001-medical-record-total-value';
import { AppointmentsAndMedicalRecordRefactor1748000000000 } from './1748000000000-appointments-and-medical-record-refactor';
import { DropAttendanceStatusFromMedicalRecord1748000000002 } from './1748000000002-drop-attendance-status-from-medical-record';
import { ServiceQuantitySessionsAndAppointmentAttended1748000000003 } from './1748000000003-service-quantity-sessions-and-appointment-attended';
import { EnsureNotificationUserId1748000000004 } from './1748000000004-ensure-notification-user-id';
import { AppointmentCanceledBy1748000000005 } from './1748000000005-appointment-canceled-by';

/**
 * Lista explícita — necessária no Vercel/serverless.
 * Glob dinâmico (`migrations/*`) não entra no bundle e as migrations nunca rodam.
 */
export const migrations = [
  Users1714602960508,
  Clients1714602978514,
  MedicalRecord1728170882520,
  Pathologies1728171159644,
  Treatment1728171322002,
  Questions1728180646238,
  Feedback1728763238534,
  MedicalRecordPathologies1728764877475,
  MedicalRecordQuestions1728764903649,
  ClientAddress1733775454390,
  AddReminderSentAt1745343600000,
  UpdateUserCredentials1745539600000,
  MedicalRecordDocuments1745914800000,
  RemoveGoogleCalendarColumns1746000000000,
  Notification1746845668000,
  ServicesAndMedicalRecordServices1747000000000,
  MedicalRecordTotalValue1747000000001,
  AppointmentsAndMedicalRecordRefactor1748000000000,
  DropAttendanceStatusFromMedicalRecord1748000000002,
  ServiceQuantitySessionsAndAppointmentAttended1748000000003,
  EnsureNotificationUserId1748000000004,
  AppointmentCanceledBy1748000000005,
];
