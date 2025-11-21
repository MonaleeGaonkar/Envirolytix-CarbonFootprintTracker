import React, { useState } from 'react';
import { BoltIcon, CarIcon, LeafIcon, EarthIcon, ShoppingBagIcon, RecyclingIcon, ArrowLeftIcon } from './ui/Icons';
import Button from './ui/Button';

// --- Constants & Types ---
const STEPS = [
  { id: 1, name: 'Electricity', icon: BoltIcon },
  { id: 2, name: 'Transport', icon: CarIcon },
  { id: 3, name: 'Lifestyle', icon: ShoppingBagIcon },
  { id: 4, name: 'Result', icon: EarthIcon },
];

type ElectricityMode = 'quick' | 'advanced';
type QuickSelection = 'small' | 'medium' | 'large';
type TransportMode = 'car' | 'public' | 'walk';
type Diet = 'vegetarian' | 'mixed' | 'meat';
type Shopping = 'rarely' | 'sometimes' | 'often';

const CarbonFootprintCalculator = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  // Step 1: Electricity
  const [electricityMode, setElectricityMode] = useState<ElectricityMode>('quick');
  const [quickSelection, setQuickSelection] = useState<QuickSelection>('medium');
  const [monthlyBill, setMonthlyBill] = useState(2000);

  // Step 2: Transport
  const [transportMode, setTransportMode] = useState<TransportMode>('car');
  const [weeklyKms, setWeeklyKms] = useState(50);

  // Step 3: Lifestyle
  const [diet, setDiet] = useState<Diet>('mixed');
  const [shopping, setShopping] = useState<Shopping>('sometimes');
  const [recycling, setRecycling] = useState(true);

  const goToNextStep = () => setStep(s => Math.min(s + 1, STEPS.length));
  const goToPrevStep = () => setStep(s => Math.max(s - 1, 1));
  
  const handleCalculate = () => {
    setIsLoading(true);
    setStep(4); // Move to result step to show loader
    
    // --- Emission Calculations (in tons CO2e/year) ---
    // 1. Electricity
    const KWH_PER_MONTH_QUICK = { small: 100, medium: 250, large: 400 };
    const KWH_PER_RUPEE = 1 / 6;
    const ELECTRICITY_KG_PER_KWH = 0.475;

    const monthlyKwh = electricityMode === 'quick'
      ? KWH_PER_MONTH_QUICK[quickSelection]
      : monthlyBill * KWH_PER_RUPEE;
    
    const electricityEmission = (monthlyKwh * 12 * ELECTRICITY_KG_PER_KWH) / 1000;

    // 2. Transport
    const WEEKS_PER_YEAR = 52;
    const TRANSPORT_KG_PER_KM = { car: 0.21, public: 0.1, walk: 0 };
    const transportEmission = (weeklyKms * WEEKS_PER_YEAR * TRANSPORT_KG_PER_KM[transportMode]) / 1000;
    
    // 3. Lifestyle
    const DIET_TONS = { vegetarian: 1.7, mixed: 2.5, meat: 3.3 };
    const dietEmission = DIET_TONS[diet];

    const SHOPPING_TONS = { rarely: 0.2, sometimes: 0.5, often: 1.0 };
    const shoppingEmission = SHOPPING_TONS[shopping];

    const recyclingReduction = recycling ? 0.3 : 0;

    const totalFootprint = electricityEmission + transportEmission + dietEmission + shoppingEmission - recyclingReduction;

    setTimeout(() => {
      setResult(parseFloat(totalFootprint.toFixed(1)));
      setIsLoading(false);
    }, 2500);
  };
  
  const handleRecalculate = () => {
      setStep(1);
      setResult(null);
      // Optional: reset all inputs to default if desired
  };

  const getPersonalizedTips = () => {
    const tips = [];
    if (electricityMode === 'advanced' && monthlyBill > 2500 || electricityMode === 'quick' && quickSelection === 'large') {
      tips.push("Your electricity usage is high. Switching to LED bulbs and unplugging electronics can make a big difference.");
    }
    if (transportMode === 'car' && weeklyKms > 70) {
      tips.push("Consider using public transport or carpooling for one trip a week to significantly cut down on transport emissions.");
    }
    if (diet === 'meat') {
        tips.push("Trying 'Meatless Mondays' or swapping beef for chicken is a great way to reduce your diet's carbon footprint.");
    }
     if (shopping === 'often') {
        tips.push("Opting for quality over quantity and exploring second-hand shops can reduce the impact of your shopping habits.");
    }
    if (!recycling) {
        tips.push("Setting up a simple recycling system at home for paper, glass, and plastic is an easy win for the environment.");
    }
    if (tips.length === 0) {
        tips.push("You're doing great! Look into supporting local produce to reduce food miles.");
    }

    return tips.slice(0, 3);
  };

  const renderStepContent = () => {
    switch (step) {
      case 1: return <StepElectricity />;
      case 2: return <StepTransport />;
      case 3: return <StepLifestyle />;
      case 4: return <StepResult />;
      default: return null;
    }
  };

  const StepElectricity = () => (
    <>
      <div className="flex mb-4 border border-slate-200 dark:border-slate-700 rounded-lg p-1 bg-slate-100 dark:bg-slate-900">
        <button onClick={() => setElectricityMode('quick')} className={`w-1/2 p-2 rounded-md transition-all duration-300 text-sm font-semibold ${electricityMode === 'quick' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>
          Quick Mode
        </button>
        <button onClick={() => setElectricityMode('advanced')} className={`w-1/2 p-2 rounded-md transition-all duration-300 text-sm font-semibold ${electricityMode === 'advanced' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>
          Advanced Mode
        </button>
      </div>
      
      {electricityMode === 'quick' ? (
        <div className="space-y-3">
            {[
                {id: 'small', title: 'Small Apartment', desc: '~100 kWh/month'},
                {id: 'medium', title: 'Medium Home', desc: '~250 kWh/month'},
                {id: 'large', title: 'Large Home', desc: '~400 kWh/month'}
            ].map(item => (
                <button key={item.id} onClick={() => setQuickSelection(item.id as QuickSelection)} className={`w-full text-left p-4 border rounded-lg transition-all ${quickSelection === item.id ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 ring-2 ring-emerald-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'}`}>
                    <p className="font-bold">{item.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                </button>
            ))}
        </div>
      ) : (
        <div className="space-y-4 pt-2">
            <label htmlFor="bill-slider" className="font-semibold text-slate-700 dark:text-slate-300">Monthly Electricity Bill (₹)</label>
            <input id="bill-slider" type="range" min="500" max="5000" step="100" value={monthlyBill} onChange={(e) => setMonthlyBill(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-emerald-500" />
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <p className="font-bold text-2xl text-emerald-600 dark:text-emerald-400">₹{monthlyBill}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">≈ {(monthlyBill / 6).toFixed(0)} kWh/month</p>
            </div>
        </div>
      )}
    </>
  );
    
  const StepTransport = () => (
    <div className="space-y-4">
        <p className="font-semibold text-slate-700 dark:text-slate-300">What is your primary mode of transport?</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
             {[
                {id: 'car', title: 'Car'},
                {id: 'public', title: 'Public Transport'},
                {id: 'walk', title: 'Walking / Cycling'}
            ].map(item => (
                <button key={item.id} onClick={() => setTransportMode(item.id as TransportMode)} className={`p-4 border rounded-lg transition-all text-center ${transportMode === item.id ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 ring-2 ring-emerald-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'}`}>
                     <p className="font-bold">{item.title}</p>
                </button>
            ))}
        </div>
        {transportMode !== 'walk' && (
            <div className="pt-2">
                 <label htmlFor="kms-input" className="font-semibold text-slate-700 dark:text-slate-300">Average KMs per week</label>
                 <input id="kms-input" type="number" value={weeklyKms} onChange={e => setWeeklyKms(Number(e.target.value))} className="mt-1 w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-emerald-500 focus:border-emerald-500" placeholder="e.g., 50" />
            </div>
        )}
    </div>
  );

  const StepLifestyle = () => (
    <div className="space-y-6">
        <div>
            <p className="font-semibold mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2"><LeafIcon className="w-5 h-5 text-green-500" /> What's your diet like?</p>
            <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg p-1 bg-slate-100 dark:bg-slate-900">
                <button onClick={() => setDiet('vegetarian')} className={`w-1/3 p-2 rounded-md transition-all duration-300 text-sm font-semibold ${diet === 'vegetarian' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>Vegetarian</button>
                <button onClick={() => setDiet('mixed')} className={`w-1/3 p-2 rounded-md transition-all duration-300 text-sm font-semibold ${diet === 'mixed' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>Mixed</button>
                <button onClick={() => setDiet('meat')} className={`w-1/3 p-2 rounded-md transition-all duration-300 text-sm font-semibold ${diet === 'meat' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>Meat-heavy</button>
            </div>
        </div>
         <div>
            <p className="font-semibold mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2"><ShoppingBagIcon className="w-5 h-5 text-blue-500" /> How often do you shop for new items?</p>
            <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg p-1 bg-slate-100 dark:bg-slate-900">
                <button onClick={() => setShopping('rarely')} className={`w-1/3 p-2 rounded-md transition-all duration-300 text-sm font-semibold ${shopping === 'rarely' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>Rarely</button>
                <button onClick={() => setShopping('sometimes')} className={`w-1/3 p-2 rounded-md transition-all duration-300 text-sm font-semibold ${shopping === 'sometimes' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>Sometimes</button>
                <button onClick={() => setShopping('often')} className={`w-1/3 p-2 rounded-md transition-all duration-300 text-sm font-semibold ${shopping === 'often' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>Often</button>
            </div>
        </div>
        <div>
            <p className="font-semibold mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2"><RecyclingIcon className="w-5 h-5 text-cyan-500" /> Do you recycle?</p>
             <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg p-1 bg-slate-100 dark:bg-slate-900">
                <button onClick={() => setRecycling(true)} className={`w-1/2 p-2 rounded-md transition-all duration-300 text-sm font-semibold ${recycling ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>Yes</button>
                <button onClick={() => setRecycling(false)} className={`w-1/2 p-2 rounded-md transition-all duration-300 text-sm font-semibold ${!recycling ? 'bg-white dark:bg-slate-700 text-red-500 shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>No</button>
            </div>
        </div>
    </div>
  );
  
  const StepResult = () => {
      if (isLoading) {
          return (
              <div className="flex flex-col items-center justify-center h-80 animate-pop-in">
                <LeafIcon className="w-16 h-16 text-emerald-500 animate-spin" />
                <p className="mt-4 text-slate-500 dark:text-slate-400 font-semibold">Calculating your footprint...</p>
            </div>
          );
      }
      if (result === null) return null;

      const evaluation = result < 3 
        ? "Excellent! You’re below average 👏" 
        : result <= 5 
        ? "You’re near the average — small tweaks can help." 
        : "Your impact is high. Small changes can make a big difference.";
      const tips = getPersonalizedTips();

      return (
          <div className="text-center animate-pop-in">
            <p className="text-slate-500 dark:text-slate-400">Your Estimated Carbon Footprint</p>
            <p className="text-6xl font-extrabold text-emerald-600 dark:text-emerald-400 my-2">{result}</p>
            <p className="font-semibold text-slate-600 dark:text-slate-300 mb-4">tons of CO₂ per year</p>
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg mb-6">
                <p className="font-semibold">{evaluation}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">The global average is ~4 tons per person.</p>
            </div>
            {tips.length > 0 && (
                 <div className="space-y-3 text-left bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">Your Personalized Tips:</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 dark:text-slate-300">
                        {tips.map((tip, i) => <li key={i}>{tip}</li>)}
                    </ul>
                </div>
            )}
             <Button onClick={handleRecalculate} size="lg" className="mt-8 w-full max-w-xs mx-auto">🔁 Recalculate</Button>
          </div>
      );
  };


  return (
    <div className="max-w-2xl mx-auto animate-pop-in">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold">Carbon Footprint Calculator</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Get a quick estimate of your environmental impact.</p>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-8 px-2">
            <div className="relative w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${step === 1 ? 0 : ((step - 1) / (STEPS.length - 1)) * 100}%` }}></div>
            </div>
            <div className="mt-2 flex justify-between items-center">
                {STEPS.map(s => {
                    const isActive = step >= s.id;
                    const Icon = s.icon;
                    return (
                        <div key={s.id} className="flex flex-col items-center w-1/4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isActive ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-600 border-slate-200 dark:border-slate-500 text-slate-400'}`}>
                                <Icon className="w-4 h-4" />
                            </div>
                             <p className={`mt-1 text-xs font-semibold text-center transition-colors ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                {s.name}
                            </p>
                        </div>
                    )
                })}
            </div>
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 transition-all duration-300">
            <div className="p-6 sm:p-8 min-h-[26rem] flex flex-col justify-center">
                <div key={step} className="animate-pop-in">
                    {renderStepContent()}
                </div>
            </div>
        </div>

        {/* Navigation */}
        {step < 4 && (
             <div className="mt-6 flex justify-between items-center">
                <Button variant="secondary" onClick={goToPrevStep} disabled={step === 1} className="disabled:opacity-50">
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Back
                </Button>
                {step < 3 ? (
                    <Button onClick={goToNextStep}>Next</Button>
                ) : (
                    <Button onClick={handleCalculate} disabled={isLoading}>Calculate Footprint</Button>
                )}
            </div>
        )}
    </div>
  );
};

export default CarbonFootprintCalculator;
