
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Calendar, DollarSign, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PriceHistoryItem {
  effdate: string;
  unitprice: number | null;
}

const PriceHistory = () => {
  const { prodcode } = useParams<{ prodcode: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [productDetails, setProductDetails] = useState<{
    prodcode: string;
    description: string | null;
    unit: string | null;
  } | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryItem[]>([]);

  useEffect(() => {
    const fetchProductAndPriceHistory = async () => {
      try {
        setLoading(true);
        if (!prodcode) {
          throw new Error("Product code is required");
        }

        // Fetch product details
        const { data: productData, error: productError } = await supabase
          .from('product')
          .select('*')
          .eq('prodcode', prodcode)
          .single();

        if (productError) throw productError;
        if (!productData) throw new Error("Product not found");

        setProductDetails(productData);

        // Fetch price history
        const { data: priceData, error: priceError } = await supabase
          .from('pricehist')
          .select('effdate, unitprice')
          .eq('prodcode', prodcode)
          .order('effdate', { ascending: false });

        if (priceError) throw priceError;
        setPriceHistory(priceData || []);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to load product information",
          variant: "destructive",
        });
        navigate("/products");
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndPriceHistory();
  }, [prodcode, navigate, toast]);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/products")}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Price History</h2>
            <p className="text-muted-foreground">
              View historical pricing information for a product
            </p>
          </div>
        </div>

        {loading ? (
          <Card className="flex items-center justify-center p-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Loading price history...</p>
            </div>
          </Card>
        ) : !productDetails ? (
          <Card className="p-6 text-center">
            <p>Product not found. Please go back and select a valid product.</p>
            <Button
              onClick={() => navigate("/products")}
              className="mt-4"
            >
              Return to Products
            </Button>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5">
                  <span>{productDetails.prodcode}</span>
                  {productDetails.description && (
                    <span className="text-muted-foreground">
                      - {productDetails.description}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {productDetails.unit && (
                    <span>Unit: {productDetails.unit}</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {priceHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
                    <h3 className="text-lg font-semibold">No price history available</h3>
                    <p className="text-muted-foreground mt-1">
                      This product doesn't have any recorded price changes yet.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Effective Date</TableHead>
                        <TableHead>Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {priceHistory.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{formatDate(item.effdate)}</TableCell>
                          <TableCell>
                            {item.unitprice !== null ? (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                {new Intl.NumberFormat('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                }).format(item.unitprice)}
                              </div>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PriceHistory;
