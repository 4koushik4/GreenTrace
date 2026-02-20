import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { createPickup } from '@/lib/pickups';
import { useAuth } from '@/lib/supabase';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, startOfToday, addDays } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  phone: z.string().min(10, {
    message: 'Please enter a valid phone number.',
  }),
  address: z.string().min(10, {
    message: 'Please enter your complete address.',
  }),
  wasteType: z.enum(['e-waste', 'hazardous', 'bulk', 'other']),
  pickupDate: z.date({
    required_error: 'Please select a date.',
  }).refine((date) => date >= new Date(new Date().setHours(0, 0, 0, 0)), {
    message: 'Pickup date must be in the future.',
  }).refine((date) => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return date <= maxDate;
  }, {
    message: 'Pickup date must be within 30 days.',
  }),
  timeSlot: z.enum(['morning', 'afternoon', 'evening'], {
    required_error: 'Please select a time slot.',
  }),
  description: z.string().optional(),
});

export default function WastePickup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      description: '',
      timeSlot: 'morning',
    },
  });

  const { user } = useAuth();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      const uid = user?.id || 'mock-user-1';
      const pickupDateTime = new Date(values.pickupDate);
      const timeSlots = {
        morning: 9,
        afternoon: 14,
        evening: 18,
      };
      pickupDateTime.setHours(timeSlots[values.timeSlot as keyof typeof timeSlots], 0, 0, 0);

      const pickup = await createPickup({
        user_id: uid,
        name: values.name,
        email: values.email,
        phone: values.phone,
        address: values.address,
        waste_type: values.wasteType as any,
        pickup_date: pickupDateTime.toISOString(),
        description: values.description,
      });
      
      toast({
        title: 'Success!',
        description: 'Your pickup request has been scheduled.',
      });
      
      try {
        const { requestPermission, scheduleReminder } = await import('@/lib/notifications');
        requestPermission();
        const reminderTime = new Date(new Date(values.pickupDate).getTime() - 60 * 60 * 1000);
        scheduleReminder(reminderTime, 'Pickup reminder', { body: `Pickup today for ${pickup.waste_type}` });
      } catch {}
      setSubmitted(true);
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to schedule pickup',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="container mx-auto p-4">
        <Alert>
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>
            Your pickup request has been submitted. We will contact you shortly to confirm the details.
          </AlertDescription>
          <div className="flex gap-3 mt-4">
            <Button onClick={() => navigate('/pickups')}>
              View My Pickups
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSubmitted(false);
                form.reset();
              }}
            >
              Schedule Another
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Schedule Waste Pickup</CardTitle>
          <CardDescription>
            Request a pickup for e-waste, hazardous materials, or bulk items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your.email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Your phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pickup Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter your complete address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="wasteType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Waste Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select waste type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="e-waste">E-Waste</SelectItem>
                          <SelectItem value="hazardous">Hazardous Waste</SelectItem>
                          <SelectItem value="bulk">Bulk Items</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pickupDate"
                  render={({ field }) => {
                    const today = startOfToday();
                    
                    return (
                      <FormItem className="flex flex-col">
                        <FormLabel>Pickup Date</FormLabel>
                        <div className="space-y-3">
                          {/* Quick Select Buttons */}
                          <div className="flex gap-2 flex-wrap">
                            {[1, 2, 3, 7].map((days) => {
                              const selectedDate = addDays(today, days);
                              const isSelected = field.value && format(field.value, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                              return (
                                <Button
                                  key={days}
                                  type="button"
                                  variant={isSelected ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => field.onChange(selectedDate)}
                                >
                                  {days === 1 ? 'Tomorrow' : `+${days}d`}
                                </Button>
                              );
                            })}
                          </div>

                          {/* Date Picker */}
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'w-full pl-3 text-left font-normal h-10',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, 'EEE, MMM dd, yyyy')
                                  ) : (
                                    'Select a date'
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => {
                                  if (date) field.onChange(date);
                                }}
                                disabled={(date) => {
                                  const comparison = format(date, 'yyyy-MM-dd');
                                  const todayStr = format(today, 'yyyy-MM-dd');
                                  const maxDate = format(addDays(today, 30), 'yyyy-MM-dd');
                                  return comparison < todayStr || comparison > maxDate;
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="timeSlot"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Time Slot</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="morning">
                            <span>🌅 Morning (9:00 AM - 12:00 PM)</span>
                          </SelectItem>
                          <SelectItem value="afternoon">
                            <span>☀️ Afternoon (2:00 PM - 5:00 PM)</span>
                          </SelectItem>
                          <SelectItem value="evening">
                            <span>🌆 Evening (6:00 PM - 9:00 PM)</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        We'll contact you to confirm the exact time
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Details</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the items to be picked up and any special instructions"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Please provide any relevant details about the items or special handling requirements
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting} size="lg">
                {isSubmitting ? 'Scheduling...' : 'Schedule Pickup'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
