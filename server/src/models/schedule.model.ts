import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { ISchedule, IVenue, IRoom, IActivity } from '@sh/interfaces';
import { Color } from '@sh/enums';

@Schema({ _id: false })
class Activity implements IActivity {
  @Prop({ required: true, immutable: true })
  id: number;

  @Prop({ required: true, immutable: true })
  activityCode: string;

  @Prop()
  name?: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ type: [SchemaFactory.createForClass(Activity)] })
  childActivity?: Activity[];
}

const ActivitySchema = SchemaFactory.createForClass(Activity);

@Schema({ _id: false })
class Room implements IRoom {
  @Prop({ required: true, immutable: true })
  id: number;

  @Prop({ required: true })
  name: string;

  @Prop({ enum: Color, required: true })
  color: Color;

  @Prop({ type: [ActivitySchema], required: true })
  activities: Activity[];
}

const RoomSchema = SchemaFactory.createForClass(Room);

@Schema({ _id: false })
class Venue implements IVenue {
  @Prop({ required: true, immutable: true })
  id: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  latitudeMicrodegrees: number;

  @Prop({ required: true })
  longitudeMicrodegrees: number;

  @Prop({ required: true })
  countryIso2: string;

  @Prop({ required: true })
  timezone: string;

  @Prop({ type: [RoomSchema], required: true })
  rooms: Room[];
}

const VenueSchema = SchemaFactory.createForClass(Venue);

@Schema({ timestamps: true })
export class Schedule implements ISchedule {
  @Prop({ required: true, immutable: true, unique: true })
  competitionId: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  numberOfDays: number;

  @Prop({ type: [VenueSchema], required: true })
  venues: Venue[];
}

export type ScheduleDocument = HydratedDocument<Schedule>;

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
