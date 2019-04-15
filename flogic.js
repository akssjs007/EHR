/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global getAssetRegistry getFactory emit */

/**
 * Sample transaction processor function.
 * @param {org.ehr.basic.confirmAppoint} catx The sample transaction instance.
 * @transaction
 */
async function gettingAppointment(catx) {
  if (catx.appoint.status === 'CONFIRMED'){
    throw new Error('Appointment already confirmed');
  }
  if (catx.appoint.status === 'CONSULTED'){
    throw new Error('Appointment already consulted');
  }
  if (catx.appoint.status === 'REJECTED'){
    throw new Error('Appointment already rejected');
  }
  if (catx.visitor.id != catx.visitor.prescriptions.visitor.id){
    throw new Error("Visitor is not same as the patient in the prescription");
  }
  if (catx.doctor.speciality != catx.appoint.group){
    throw new Error('Doctor is not specialized into the required disease category');
  }
  
  catx.appoint.status = 'CONFIRMED';
  catx.appoint.patient = catx.patient;
  catx.appoint.assigned = catx.doctor;
  
  const appointRegistry = await getAssetRegistry('org.example.mynetwork.Appointment');
  await appointRegistry.update(catx.appoint);
}

/**
 * Sample transaction processor function.
 * @param {org.ehr.basic.consult} ctx The sample transaction instance.
 * @transaction
 */
async function gettingChecked(ctx) {
  if(!(ctx.presc.isMedPrescribed || ctx.presc.isTestPrescribed )){
    throw new Error('Prescription should prescibe either test or medicine')
  }
  if (ctx.appoint.status === 'PENDING'){
    throw new Error('Appointment yet to be confirmed!')
  }
  if (ctx.appoint.appointmentId != ctx.presc.appoint.appointmentId){
    throw new Error('Prescription not matching with the appointment!')
  }
  if (ctx.appoint.status === 'CONSULTED'){
    throw new Error('Appointment already consulted!')
  }
  if (ctx.appoint.status === 'REJECTED'){
    throw new Error('Appointment already rejected!')
  }
  if(ctx.patient.id != ctx.appoint.patient.id){
    throw new Error('Patient Proxy not allowed!')
  }
  if ( ctx.presc.appoint.doctor.id != ctx.doctor.id){
    throw new Error('You are not the designated doctor')
  }

  ctx.appoint.status = 'CONSULTED';
  ctx.appoint.group = ctx.patient.disease;
  ctx.appoint.consultanceFee = ctx.doctor.consultanceFee;
  ctx.patient.debt = ctx.patient.debt + ctx.appoint.consultanceFee;
  if (ctx.appoint.isInsured || (ctx.appoint.insuranceId.ensuredAmount >= ctx.appoint.consultanceFee)){
    ctx.appoint.insuranceId.ensuredAmount = ctx.appoint.insuranceId.ensuredAmount - ctx.appoint.consultanceFee;
  } else {
    let test = ctx.appoint.consultanceFee - ctx.appoint.insuranceId.ensuredAmount;
    ctx.patient.debt = ctx.patient.debt + test;
    ctx.appoint.insuranceId.ensuredAmount = 0
    ctx.appoint.isInsured = FALSE;
  }
  
  const pre = ctx.presc;
  
  if (pre.prescribed) {
      pre.prescribed.push(ctx.medicine);
  } else {
      pre.prescribed = [ctx.medicine];
  }
  
  pre.test = 'BLOODTEST';
  
  
  const appointRegistry = await getAssetRegistry('org.example.mynetwork.Appointment');
  await appointRegistry.update(ctx.appoint);
  const patientRegistry = await getParticipantRegistry('org.example.mynetwork.Patient');
  await patientRegistry.update(ctx.patient);
  const prescriptionRegistry = await getAssetRegistry('org.example.mynetwork.Prescription');
  await prescriptionRegistry.update(pre);
}
