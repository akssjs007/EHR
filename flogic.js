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
