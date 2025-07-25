import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import NotificationPreference from '../models/NotificationPreference';
import User from '../models/User';
import Task from '../models/Task';
import Project from '../models/Project';
import { NotificationService } from '../services/NotificationService';

describe('NotificationService - Daily Reminders', () => {
  let mongoServer: MongoMemoryServer;
  let notificationService: NotificationService;
  let testUser: any;
  let testProject: any;
  let testTask: any;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Limpiar base de datos
    await NotificationPreference.deleteMany({});
    await Task.deleteMany({});
    await Project.deleteMany({});
    await User.deleteMany({});

    // Crear datos de prueba
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword',
      confirmed: true,
    });

    testProject = await Project.create({
      projectName: 'Test Project',
      clientName: 'Test Client',
      description: 'Test Description',
      manager: testUser._id,
      team: [testUser._id],
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    testTask = await Task.create({
      name: 'Test Task',
      description: 'Test Description',
      project: testProject._id,
      dueDate: tomorrow,
      status: 'pending',
    });

    notificationService = NotificationService.getInstance();
  });

  test('should create notification preference with daily reminders enabled', async () => {
    const preference = await NotificationPreference.create({
      user: testUser._id,
      task: testTask._id,
      reminderDays: 1,
      isEnabled: true,
      isDailyReminderEnabled: true,
    });

    expect(preference.isDailyReminderEnabled).toBe(true);
    expect(preference.lastDailyReminderAt).toBeUndefined();
  });

  test('should detect tasks for daily reminder', async () => {
    // Crear preferencia con recordatorios diarios habilitados
    await NotificationPreference.create({
      user: testUser._id,
      task: testTask._id,
      reminderDays: 1,
      isEnabled: true,
      isDailyReminderEnabled: true,
    });

    // Mock del método de envío para evitar envío real
    const sendEmailSpy = jest.spyOn(require('../services/EmailService').EmailService, 'sendEmail')
      .mockResolvedValue(undefined);

    await notificationService.checkAndSendDailyReminders();

    // Verificar que se intentó enviar el recordatorio
    expect(sendEmailSpy).toHaveBeenCalled();
    
    sendEmailSpy.mockRestore();
  });

  test('should not send daily reminder for completed tasks', async () => {
    // Crear tarea completada
    await Task.findByIdAndUpdate(testTask._id, { status: 'completed' });

    await NotificationPreference.create({
      user: testUser._id,
      task: testTask._id,
      reminderDays: 1,
      isEnabled: true,
      isDailyReminderEnabled: true,
    });

    const sendEmailSpy = jest.spyOn(require('../services/EmailService').EmailService, 'sendEmail')
      .mockResolvedValue(undefined);

    await notificationService.checkAndSendDailyReminders();

    // No debería enviar recordatorio para tareas completadas
    expect(sendEmailSpy).not.toHaveBeenCalled();
    
    sendEmailSpy.mockRestore();
  });

  test('should not send daily reminder twice in the same day', async () => {
    const today = new Date();
    
    await NotificationPreference.create({
      user: testUser._id,
      task: testTask._id,
      reminderDays: 1,
      isEnabled: true,
      isDailyReminderEnabled: true,
      lastDailyReminderAt: today, // Ya se envió hoy
    });

    const sendEmailSpy = jest.spyOn(require('../services/EmailService').EmailService, 'sendEmail')
      .mockResolvedValue(undefined);

    await notificationService.checkAndSendDailyReminders();

    // No debería enviar recordatorio si ya se envió hoy
    expect(sendEmailSpy).not.toHaveBeenCalled();
    
    sendEmailSpy.mockRestore();
  });

  test('should send daily reminder for overdue tasks', async () => {
    // Crear tarea vencida
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    await Task.findByIdAndUpdate(testTask._id, { dueDate: yesterday });

    await NotificationPreference.create({
      user: testUser._id,
      task: testTask._id,
      reminderDays: 1,
      isEnabled: true,
      isDailyReminderEnabled: true,
    });

    const sendEmailSpy = jest.spyOn(require('../services/EmailService').EmailService, 'sendEmail')
      .mockResolvedValue(undefined);

    await notificationService.checkAndSendDailyReminders();

    // Debería enviar recordatorio para tareas vencidas
    expect(sendEmailSpy).toHaveBeenCalled();
    const callArgs = sendEmailSpy.mock.calls[0][0] as any;
    expect(callArgs.subject).toContain('VENCIDA');
    
    sendEmailSpy.mockRestore();
  });

  test('should update lastDailyReminderAt after sending', async () => {
    const preference = await NotificationPreference.create({
      user: testUser._id,
      task: testTask._id,
      reminderDays: 1,
      isEnabled: true,
      isDailyReminderEnabled: true,
    });

    const sendEmailSpy = jest.spyOn(require('../services/EmailService').EmailService, 'sendEmail')
      .mockResolvedValue(undefined);

    await notificationService.checkAndSendDailyReminders();

    // Verificar que se actualizó la fecha de último envío
    const updatedPreference = await NotificationPreference.findById(preference._id);
    expect(updatedPreference!.lastDailyReminderAt).toBeDefined();
    
    sendEmailSpy.mockRestore();
  });
});

describe('NotificationPreference Model - Daily Reminders', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  test('should create notification preference with default daily reminder disabled', async () => {
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword',
      confirmed: true,
    });

    const testProject = await Project.create({
      projectName: 'Test Project',
      clientName: 'Test Client',
      description: 'Test Description',
      manager: testUser._id,
      team: [testUser._id],
    });

    const testTask = await Task.create({
      name: 'Test Task',
      description: 'Test Description',
      project: testProject._id,
      dueDate: new Date(),
      status: 'pending',
    });

    const preference = await NotificationPreference.create({
      user: testUser._id,
      task: testTask._id,
      reminderDays: 1,
      isEnabled: true,
    });

    expect(preference.isDailyReminderEnabled).toBe(false); // Por defecto debe estar deshabilitado
  });

  test('should allow enabling daily reminders', async () => {
    const testUser = await User.create({
      name: 'Test User 2',
      email: 'test2@example.com',
      password: 'hashedpassword',
      confirmed: true,
    });

    const testProject = await Project.create({
      projectName: 'Test Project 2',
      clientName: 'Test Client 2',
      description: 'Test Description',
      manager: testUser._id,
      team: [testUser._id],
    });

    const testTask = await Task.create({
      name: 'Test Task 2',
      description: 'Test Description',
      project: testProject._id,
      dueDate: new Date(),
      status: 'pending',
    });

    const preference = await NotificationPreference.create({
      user: testUser._id,
      task: testTask._id,
      reminderDays: 1,
      isEnabled: true,
      isDailyReminderEnabled: true,
    });

    expect(preference.isDailyReminderEnabled).toBe(true);
  });
});
