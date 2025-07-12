
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MotionDiv } from '@/components/ui/motion';
import { Check, CheckCircle, CreditCard, Download, PlusCircle, Star, CircleDollarSign, Loader2, ShieldCheck, Landmark, Wallet, Smartphone, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AnimatePresence, motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';


const mockPlan = {
  name: 'Pro Plan',
  price: '$25/month',
  features: [
    'Unlimited prompts',
    'Access to all AI models',
    'Smart AI Router',
    'Advanced collaboration tools',
    'Priority support',
  ],
  renews: 'August 15, 2024',
};

const mockPaymentMethods = [
  {
    id: 'pm_1',
    type: 'Visa',
    last4: '4242',
    expiry: '08/26',
    isPrimary: true,
  },
];

const mockBillingHistory = [
  {
    invoiceId: 'INV-2024-003',
    date: 'July 15, 2024',
    amount: '$25.00',
    status: 'Paid',
  },
  {
    invoiceId: 'INV-2024-002',
    date: 'June 15, 2024',
    amount: '$25.00',
    status: 'Paid',
  },
  {
    invoiceId: 'INV-2024-001',
    date: 'May 15, 2024',
    amount: '$25.00',
    status: 'Paid',
  },
];

const pricingPlans = [
  {
    name: 'Free',
    price: 0,
    description: 'For individuals getting started with AI.',
    features: [
      '50 prompts per month',
      'Access to 3 AI models',
      'Basic chat history',
      'Standard support',
    ],
    cta: 'Get Started',
    variant: 'outline',
  },
  {
    name: 'Starter',
    price: 15,
    description: 'For hobbyists and frequent users.',
    features: [
      '500 prompts per month',
      'Access to 5 AI models',
      '30-day chat history',
      'Email support',
    ],
    cta: 'Get Started',
    variant: 'outline',
  },
  {
    name: 'Pro',
    price: 25,
    isPopular: true,
    description: 'For professionals who need full power.',
    features: [
      'Unlimited prompts',
      'Access to all AI models',
      'Smart AI Router',
      'Advanced collaboration tools',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    variant: 'default',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large teams and organizations.',
    features: [
      'Everything in Pro',
      'Custom AI model stack',
      'Dedicated onboarding',
      'SAML SSO',
      'Enterprise-grade security',
    ],
    cta: 'Contact Sales',
    variant: 'outline',
  },
];


const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

const BillingPageSkeleton = () => (
    <div className="space-y-8">
        <div>
            <Skeleton className="h-10 w-1/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
        </div>
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
             <div className="lg:col-span-1 space-y-8">
                 <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                             <Skeleton className="h-6 w-32" />
                             <Skeleton className="h-4 w-40" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                        <Separator />
                        <div className="text-center p-4 rounded-lg">
                            <Skeleton className="h-4 w-3/4 mx-auto mb-2" />
                             <Skeleton className="h-8 w-1/2 mx-auto" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-10 w-full" />
                    </CardFooter>
                </Card>
             </div>
             <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48 mb-2"/>
                        <Skeleton className="h-4 w-64"/>
                    </CardHeader>
                     <CardContent>
                        <div className="rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-4">
                                     <Skeleton className="h-8 w-8 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-40" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                </div>
                                <Skeleton className="h-8 w-16" />
                            </div>
                        </div>
                     </CardContent>
                     <CardFooter className="border-t pt-6">
                        <Skeleton className="h-10 w-56" />
                    </CardFooter>
                </Card>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-40 mb-2"/>
                        <Skeleton className="h-4 w-56"/>
                    </CardHeader>
                     <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead><Skeleton className="h-5 w-20"/></TableHead>
                                    <TableHead><Skeleton className="h-5 w-24"/></TableHead>
                                    <TableHead><Skeleton className="h-5 w-16"/></TableHead>
                                    <TableHead><Skeleton className="h-5 w-16"/></TableHead>
                                    <TableHead className="text-right"><Skeleton className="h-5 w-10 ml-auto"/></TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {[...Array(3)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                                        <TableCell><Skeleton className="h-5 w-28"/></TableCell>
                                        <TableCell><Skeleton className="h-5 w-20"/></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16"/></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto"/></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     </CardContent>
                </Card>
             </div>
        </div>
    </div>
);


export default function BillingPage() {
    const [currentPlan, setCurrentPlan] = useState<typeof mockPlan | null>(null);
    const [paymentMethods, setPaymentMethods] = useState<typeof mockPaymentMethods>([]);
    const [billingHistory, setBillingHistory] = useState<typeof mockBillingHistory>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasSubscription, setHasSubscription] = useState(false);
    const [isYearly, setIsYearly] = useState(false);
    const { toast } = useToast();
    const [upiMethod, setUpiMethod] = useState('id');

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            // In a real app, you would fetch user subscription status here.
            // We'll simulate a user with a subscription for this demo.
            // To see the "no subscription" state, set this to false.
            const userHasSubscription = true;

            setHasSubscription(userHasSubscription);
            if (userHasSubscription) {
                setCurrentPlan(mockPlan);
                setPaymentMethods(mockPaymentMethods);
                setBillingHistory(mockBillingHistory);
            }
            setIsLoading(false);
        }, 1500); // Simulate network delay

        return () => clearTimeout(timer);
    }, []);

    const handleManageSubscription = () => {
        toast({
            title: 'Redirecting to Customer Portal',
            description: 'You will be redirected to manage your subscription securely.',
        });
        // In a real app, you would use the Stripe Customer Portal URL here
        // window.location.href = stripePortalUrl;
    };
    
    const handleSavePaymentMethod = () => {
         toast({
            title: 'Payment Method Saved',
            description: 'Your new payment method has been added successfully.',
        });
        // Here you would add logic to close the dialog
        // and refresh the payment methods list.
    }

    const handleDownloadInvoice = (invoiceId: string) => {
        toast({
            title: 'Invoice Download Started',
            description: `Invoice ${invoiceId} is being prepared for download.`,
        });
        // In a real app, this would trigger a download of the invoice PDF
    };

    if (isLoading) {
        return (
            <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
                <BillingPageSkeleton />
            </div>
        );
    }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      {hasSubscription && currentPlan ? (
        // ACTIVE SUBSCRIPTION VIEW
        <div className="space-y-8">
          <MotionDiv variants={itemVariants} initial="hidden" animate="visible">
              <h1 className="font-headline text-4xl font-bold tracking-tight">Billing & Payments</h1>
              <p className="text-muted-foreground">Manage your subscription, payment methods, and view your invoice history.</p>
          </MotionDiv>

          <MotionDiv
              className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
          >
              <MotionDiv variants={itemVariants} className="lg:col-span-1 space-y-8">
              <Card className="glassmorphic">
                  <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full border border-primary/20">
                      <Star className="h-6 w-6 text-primary"/>
                  </div>
                  <div>
                      <CardTitle className="font-headline">Current Plan</CardTitle>
                      <CardDescription>You are on the {currentPlan.name}.</CardDescription>
                  </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                  <div className="space-y-2">
                      {currentPlan.features.slice(0, 3).map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500"/>
                              <span>{feature}</span>
                          </div>
                      ))}
                  </div>
                  <Separator/>
                      <div className="text-center bg-primary/10 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">Your plan renews on</p>
                          <p className="font-semibold text-lg">{currentPlan.renews}</p>
                      </div>
                  </CardContent>
                  <CardFooter>
                      <Button className="w-full" onClick={handleManageSubscription}>Manage Subscription</Button>
                  </CardFooter>
              </Card>
              </MotionDiv>

              <div className="lg:col-span-2 space-y-8">
                  <MotionDiv variants={itemVariants}>
                  <Card className="glassmorphic">
                      <CardHeader>
                      <div className="flex items-center gap-3">
                              <CreditCard className="w-6 h-6 text-primary"/>
                              <CardTitle className="font-headline">Payment Methods</CardTitle>
                          </div>
                      <CardDescription>Manage your saved payment methods.</CardDescription>
                      </CardHeader>
                      <CardContent>
                      <div className="space-y-4">
                          {paymentMethods.map((method) => (
                          <div key={method.id} className="flex items-center justify-between rounded-lg border p-4">
                              <div className="flex items-center gap-4">
                              <CircleDollarSign className="w-8 h-8 text-muted-foreground"/>
                              <div>
                                      <p className="font-semibold">{method.type} ending in {method.last4}</p>
                                      <p className="text-sm text-muted-foreground">Expires {method.expiry}</p>
                              </div>
                              </div>
                              <div className="flex items-center gap-2">
                                  {method.isPrimary && <Badge>Primary</Badge>}
                                  <Button variant="ghost" size="sm">Edit</Button>
                              </div>
                          </div>
                          ))}
                      </div>
                      </CardContent>
                      <CardFooter className="border-t pt-6">
                          <Dialog>
                              <DialogTrigger asChild>
                                  <Button variant="outline" className="glassmorphic">
                                      <PlusCircle className="mr-2 h-4 w-4"/>
                                      Add New Payment Method
                                  </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-lg glassmorphic">
                                  <DialogHeader>
                                      <DialogTitle className="font-headline text-xl">Add New Payment Method</DialogTitle>
                                      <DialogDescription>
                                          Choose your preferred payment option. All transactions are secure.
                                      </DialogDescription>
                                  </DialogHeader>
                                  <Tabs defaultValue="card" className="w-full">
                                      <TabsList className="grid w-full grid-cols-4 h-auto p-1">
                                          <TabsTrigger value="card" className="flex-col sm:flex-row gap-1 h-12"><CreditCard className="w-5 h-5"/>Card</TabsTrigger>
                                          <TabsTrigger value="upi" className="flex-col sm:flex-row gap-1 h-12"><Smartphone className="w-5 h-5"/>UPI</TabsTrigger>
                                          <TabsTrigger value="netbanking" className="flex-col sm:flex-row gap-1 h-12"><Landmark className="w-5 h-5"/>Net Banking</TabsTrigger>
                                          <TabsTrigger value="wallets" className="flex-col sm:flex-row gap-1 h-12"><Wallet className="w-5 h-5"/>Wallets</TabsTrigger>
                                      </TabsList>
                                      <TabsContent value="card" className="pt-6">
                                          <div className="space-y-4">
                                              <div className="space-y-2">
                                                  <Label htmlFor="card-number">Card Number</Label>
                                                  <Input id="card-number" placeholder="0000 0000 0000 0000" className="bg-input/50"/>
                                              </div>
                                              <div className="grid grid-cols-2 gap-4">
                                                  <div className="space-y-2">
                                                      <Label htmlFor="expiry">Expiry Date</Label>
                                                      <Input id="expiry" placeholder="MM/YY" className="bg-input/50"/>
                                                  </div>
                                                  <div className="space-y-2">
                                                      <Label htmlFor="cvc">CVC / CVV</Label>
                                                      <Input id="cvc" placeholder="123" className="bg-input/50"/>
                                                  </div>
                                              </div>
                                              <div className="space-y-2">
                                                  <Label htmlFor="name">Name on Card</Label>
                                                  <Input id="name" placeholder="Ada Lovelace" className="bg-input/50"/>
                                              </div>
                                          </div>
                                      </TabsContent>
                                      <TabsContent value="upi" className="pt-6">
                                          <div className="space-y-4">
                                              <RadioGroup defaultValue="id" onValueChange={setUpiMethod} className="grid grid-cols-2 gap-4">
                                                  <Label htmlFor="upi-id-option" className="flex items-center gap-2 rounded-md border p-4 cursor-pointer hover:bg-accent/50 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                                      <RadioGroupItem value="id" id="upi-id-option" />
                                                      Pay with UPI ID
                                                  </Label>
                                                  <Label htmlFor="upi-qr-option" className="flex items-center gap-2 rounded-md border p-4 cursor-pointer hover:bg-accent/50 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                                      <RadioGroupItem value="qr" id="upi-qr-option" />
                                                      Scan QR Code
                                                  </Label>
                                              </RadioGroup>
                                              <AnimatePresence mode="wait">
                                              {upiMethod === 'id' ? (
                                                  <MotionDiv
                                                      key="upi-id-input"
                                                      initial={{ opacity: 0, y: -10 }}
                                                      animate={{ opacity: 1, y: 0 }}
                                                      exit={{ opacity: 0, y: -10 }}
                                                      transition={{ duration: 0.3 }}
                                                  >
                                                      <div className="space-y-2 pt-2">
                                                          <Label htmlFor="upi-id">Enter your UPI ID</Label>
                                                          <Input id="upi-id" placeholder="yourname@bank" className="bg-input/50"/>
                                                          <p className="text-xs text-muted-foreground text-center pt-2">
                                                              You will receive a payment request on your UPI app.
                                                          </p>
                                                      </div>
                                                  </MotionDiv>
                                              ) : (
                                                  <MotionDiv
                                                      key="upi-qr-code"
                                                      initial={{ opacity: 0, y: 10 }}
                                                      animate={{ opacity: 1, y: 0 }}
                                                      exit={{ opacity: 0, y: 10 }}
                                                      transition={{ duration: 0.3 }}
                                                      className="flex flex-col items-center justify-center pt-4 space-y-3"
                                                  >
                                                      <div className="p-2 border rounded-lg bg-white">
                                                          <img src="https://placehold.co/160x160.png" alt="UPI QR Code" data-ai-hint="qr code" className="w-40 h-40" />
                                                      </div>
                                                      <p className="text-sm text-muted-foreground">Scan this QR code with your UPI app.</p>
                                                  </MotionDiv>
                                              )}
                                              </AnimatePresence>
                                          </div>
                                      </TabsContent>
                                      <TabsContent value="netbanking" className="pt-6">
                                          <div className="space-y-4">
                                              <Label>Choose your bank</Label>
                                              <Select>
                                                  <SelectTrigger className="w-full bg-input/50">
                                                      <SelectValue placeholder="Select a bank..." />
                                                  </SelectTrigger>
                                                  <SelectContent className="glassmorphic">
                                                      <SelectItem value="sbi">State Bank of India</SelectItem>
                                                      <SelectItem value="hdfc">HDFC Bank</SelectItem>
                                                      <SelectItem value="icici">ICICI Bank</SelectItem>
                                                      <SelectItem value="axis">Axis Bank</SelectItem>
                                                      <SelectItem value="other">Other Bank</SelectItem>
                                                  </SelectContent>
                                              </Select>
                                              <p className="text-xs text-muted-foreground text-center pt-2">
                                                  You will be redirected to your bank's portal to complete the payment.
                                              </p>
                                          </div>
                                      </TabsContent>
                                      <TabsContent value="wallets" className="pt-6">
                                          <div className="space-y-4">
                                              <Label>Select a wallet</Label>
                                              <RadioGroup defaultValue="paytm" className="grid grid-cols-2 gap-4">
                                                  <Label htmlFor="paytm" className="flex items-center gap-2 rounded-md border p-4 cursor-pointer hover:bg-accent/50 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                                      <RadioGroupItem value="paytm" id="paytm" />
                                                      Paytm
                                                  </Label>
                                                  <Label htmlFor="phonepe" className="flex items-center gap-2 rounded-md border p-4 cursor-pointer hover:bg-accent/50 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                                      <RadioGroupItem value="phonepe" id="phonepe" />
                                                      PhonePe
                                                  </Label>
                                                  <Label htmlFor="mobikwik" className="flex items-center gap-2 rounded-md border p-4 cursor-pointer hover:bg-accent/50 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                                      <RadioGroupItem value="mobikwik" id="mobikwik" />
                                                      MobiKwik
                                                  </Label>
                                                  <Label htmlFor="freecharge" className="flex items-center gap-2 rounded-md border p-4 cursor-pointer hover:bg-accent/50 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                                      <RadioGroupItem value="freecharge" id="freecharge" />
                                                      Freecharge
                                                  </Label>
                                              </RadioGroup>
                                          </div>
                                      </TabsContent>
                                  </Tabs>
                                  <DialogFooter className="pt-6 flex-col sm:flex-col sm:space-x-0 gap-2">
                                      <Button className="w-full" size="lg" onClick={handleSavePaymentMethod}>
                                      <span className="font-semibold">Securely Add Payment Method</span>
                                      </Button>
                                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                          <ShieldCheck className="w-4 h-4 text-green-500" />
                                          <span>Secure payments powered by Razorpay.</span>
                                      </div>
                                  </DialogFooter>
                              </DialogContent>
                          </Dialog>
                      </CardFooter>
                  </Card>
                  </MotionDiv>
                  <MotionDiv variants={itemVariants}>
                  <Card className="glassmorphic">
                      <CardHeader>
                      <CardTitle className="font-headline">Billing History</CardTitle>
                      <CardDescription>View and download your past invoices.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>Invoice ID</TableHead>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Amount</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead className="text-right">Action</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {billingHistory.map((invoice) => (
                                      <TableRow key={invoice.invoiceId}>
                                          <TableCell className="font-medium">{invoice.invoiceId}</TableCell>
                                          <TableCell>{invoice.date}</TableCell>
                                          <TableCell>{invoice.amount}</TableCell>
                                          <TableCell>
                                              <Badge variant={invoice.status === 'Paid' ? 'secondary' : 'destructive'} className="bg-green-500/10 text-green-400 border-green-500/20">
                                                  {invoice.status}
                                              </Badge>
                                          </TableCell>
                                          <TableCell className="text-right">
                                              <Button variant="ghost" size="icon" onClick={() => handleDownloadInvoice(invoice.invoiceId)}>
                                                  <Download className="h-4 w-4"/>
                                                  <span className="sr-only">Download Invoice</span>
                                              </Button>
                                          </TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </CardContent>
                  </Card>
                  </MotionDiv>
              </div>
          </MotionDiv>
        </div>
      ) : (
        // NO SUBSCRIPTION VIEW
        <div className="space-y-8">
            <MotionDiv variants={itemVariants} initial="hidden" animate="visible">
                <h1 className="font-headline text-4xl font-bold tracking-tight">Choose Your Plan</h1>
                <p className="text-muted-foreground">You do not have an active subscription. Select a plan to get started.</p>
                 <div className="flex items-center space-x-2 pt-4">
                    <Label htmlFor="pricing-toggle">Monthly</Label>
                    <Switch 
                      id="pricing-toggle" 
                      checked={isYearly}
                      onCheckedChange={setIsYearly} 
                    />
                    <Label htmlFor="pricing-toggle">Yearly</Label>
                    <div className="w-24 h-6">
                      <AnimatePresence>
                        {isYearly && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                          >
                            <Badge variant="secondary" className="ml-2 bg-accent/20 text-accent border-accent/30">Save 30%</Badge>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                </div>
            </MotionDiv>
            <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                 {pricingPlans.map((plan) => (
                  <motion.div key={plan.name} variants={itemVariants}>
                    <Card className={`glassmorphic h-full flex flex-col ${plan.isPopular ? 'border-primary/50 relative overflow-hidden' : ''}`}>
                      {plan.isPopular && <Badge className="absolute top-0 right-0 m-4">Most Popular</Badge>}
                      <CardHeader>
                        <CardTitle className={`font-headline ${plan.isPopular ? 'text-primary' : ''}`}>{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                        <div className="text-4xl font-bold pt-4">
                          {typeof plan.price === 'number' ? (
                            <>
                              ${isYearly ? (plan.price * 12 * 0.7).toFixed(0) : plan.price}
                              <span className="text-sm font-normal text-muted-foreground">/ {isYearly ? 'year' : 'month'}</span>
                            </>
                          ) : (
                            <span className="text-3xl">{plan.price}</span>
                          )}
                        </div>
                        {isYearly && typeof plan.price === 'number' && plan.price > 0 && (
                            <p className="text-xs text-muted-foreground line-through">${plan.price * 12} / year</p>
                        )}
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <ul className="space-y-3">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="text-primary h-5 w-5 flex-shrink-0 mt-1"/>
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button className="w-full" variant={plan.variant as 'default' | 'outline'}>{plan.cta}</Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
             </motion.div>
        </div>
      )}
    </div>
  );
}
