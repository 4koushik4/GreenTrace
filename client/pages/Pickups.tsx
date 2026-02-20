import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/supabase';
import { listUserPickups, updatePickupStatus } from '@/lib/pickups';
import { Pickup } from '@/lib/pickups';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  MessageSquare,
  MapPin,
  Calendar,
  Loader2,
  Truck,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function PickupsPage() {
  const { user } = useAuth();
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadPickups();
    }
  }, [user]);

  const loadPickups = async () => {
    try {
      setLoading(true);
      const userId = user?.id || 'mock-user-1';
      const data = await listUserPickups(userId);
      setPickups(data || []);
    } catch (error) {
      console.error('Failed to load pickups:', error);
      setPickups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (pickupId: string) => {
    if (!window.confirm('Are you sure you want to cancel this pickup?')) return;
    
    try {
      await updatePickupStatus(pickupId, 'cancelled');
      await loadPickups();
      toast({
        title: 'Success',
        description: 'Pickup cancelled successfully',
      });
    } catch (error) {
      console.error('Failed to cancel pickup:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel pickup',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'collected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'requested':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'missed':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'collected':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'requested':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'missed':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg"
        >
          <Truck className="w-8 h-8 text-white" />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🚛 Schedule Pickup
          </h1>
          <p className="text-gray-400 text-lg">
            View and manage your scheduled waste pickups
          </p>
        </div>
      </motion.div>

      {pickups.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="border-0 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg mx-auto"
                >
                  <AlertCircle className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-semibold text-white">No pickups scheduled</h3>
                  <p className="text-gray-400">
                    Schedule your first waste pickup to get started
                  </p>
                </div>
                <Link to="/pickup">
                  <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg">
                    Schedule Pickup
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {pickups.map((pickup, index) => (
            <motion.div key={pickup.id} variants={itemVariants}>
              <Card className="border-0 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl text-white">
                          {pickup.waste_type.charAt(0).toUpperCase() +
                          pickup.waste_type.slice(1).replace('-', ' ')}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(pickup.status)}
                        <span
                          className={`text-sm px-2 py-1 rounded-full ${getStatusColor(
                            pickup.status,
                          )}`}
                        >
                          {pickup.status.charAt(0).toUpperCase() +
                            pickup.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    {pickup.description && (
                      <CardDescription className="text-gray-400">{pickup.description}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-400">
                        Pickup Date
                      </p>
                      <p className="font-semibold text-white">
                        {format(new Date(pickup.pickup_date), 'PPpp')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-green-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-400">
                        Location
                      </p>
                      <p className="font-semibold text-white">{pickup.address}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-purple-400 mt-0.5">📧</div>
                    <div>
                      <p className="text-sm text-gray-400">
                        Email
                      </p>
                      <p className="font-semibold text-white text-sm">{pickup.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-orange-400 mt-0.5">📱</div>
                    <div>
                      <p className="text-sm text-gray-400">
                        Phone
                      </p>
                      <p className="font-semibold text-white text-sm">{pickup.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-700 flex gap-2 justify-end">
                  <Link to={`/messages?pickupId=${pickup.id}`}>
                    <Button variant="outline" size="sm" className="border-slate-600 text-white hover:bg-slate-700">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  </Link>

                  {pickup.status !== 'collected' &&
                    pickup.status !== 'cancelled' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancel(pickup.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
          ))}
        </div>
      )}

      <motion.div variants={itemVariants}>
        <Link to="/pickup">
          <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg">
            Schedule New Pickup
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
}
