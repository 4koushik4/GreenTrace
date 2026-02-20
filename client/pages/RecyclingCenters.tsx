import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Loader2, Search, ExternalLink, Recycle } from 'lucide-react';
import { useGeolocation, useRecyclingCentersSearch, getDirectionsUrl, Location } from '@/lib/openstreetmap';

const RecyclingCenters: React.FC = () => {
  const { location, getCurrentLocation, loading: locating } = useGeolocation();
  const { centers, searchNearbyRecyclingCenters, loading } = useRecyclingCentersSearch();
  const [querying, setQuerying] = useState(false);

  const list = centers.length > 0 ? centers : [];

  const handleFindNearby = async () => {
    setQuerying(true);
    try {
      const loc = await getCurrentLocation();
      await searchNearbyRecyclingCenters(loc, 10);
    } catch (e) {
      // noop (mock centers already shown)
    } finally {
      setQuerying(false);
    }
  };

  const userLoc: Location | null = location || (list[0] ? { lat: list[0].location.lat, lng: list[0].location.lng } : null);

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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🗺️ Recycling Centers
          </h1>
          <p className="text-gray-400 text-lg">
            Find facilities near you and get directions to recycle properly
          </p>
        </div>
      </motion.div>

      {/* Find Nearby Button */}
      <motion.div variants={itemVariants} className="flex justify-center mb-6">
        <Button
          onClick={handleFindNearby}
          disabled={querying || locating}
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg px-8 py-3"
        >
          {(querying || locating) ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 mr-2"
            >
              <Loader2 className="w-5 h-5" />
            </motion.div>
          ) : (
            <MapPin className="w-5 h-5 mr-2" />
          )}
          Find Nearby Centers
        </Button>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="border-0 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm h-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Recycle className="w-6 h-6 text-green-400" />
                Recycling Centers Map
              </CardTitle>
              <CardDescription className="text-gray-400">
                Interactive map integration can be added; showing list-based explorer for now.
              </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {list.map((c, index) => (
                <motion.div key={c.id} variants={itemVariants}>
                  <Card className="border-0 bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-white">{c.name}</h3>
                          <p className="text-sm text-gray-400">{c.address}</p>
                          {c.distance !== undefined && (
                            <p className="text-xs text-gray-500 mt-1">~{c.distance.toFixed(1)} km away</p>
                          )}
                        </div>
                        <Badge variant="secondary" className="whitespace-nowrap bg-blue-500/20 text-blue-400 border-blue-500/30">{c.amenity}</Badge>
                      </div>
                      {c.recycling_type && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {c.recycling_type.map((t) => (
                            <Badge key={t} variant="outline" className="text-xs border-slate-600 text-gray-300 hover:bg-slate-700">{t}</Badge>
                          ))}
                        </div>
                      )}
                      <div className="mt-4 flex gap-2">
                        {userLoc && (
                          <a href={getDirectionsUrl(userLoc, c.location)} target="_blank" rel="noreferrer">
                            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                              <Navigation className="w-4 h-4 mr-2" /> Directions
                            </Button>
                          </a>
                        )}
                        {c.website && (
                          <a href={c.website} target="_blank" rel="noreferrer">
                            <Button size="sm" variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                              <ExternalLink className="w-4 h-4 mr-2" /> Website
                            </Button>
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="w-6 h-6 text-purple-400" />
                Search & Filters
              </CardTitle>
              <CardDescription className="text-gray-400">
                Search and narrow down recycling centers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input placeholder="Search by name or material" className="pl-9 bg-slate-700/50 border-slate-600 text-white placeholder-gray-400" />
                </div>
                <div className="text-sm text-gray-400">
                  💡 Tip: Use the Find Nearby button to auto-locate facilities around you.
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default RecyclingCenters;

