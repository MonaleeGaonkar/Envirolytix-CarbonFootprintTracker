import React, { useState } from 'react';
import { AvatarOptions } from '../types';
import { avatarCustomizationOptions } from '../constants';
import Avatar from './Avatar';
import Button from './ui/Button';
import { XCircleIcon } from './ui/Icons';

interface AvatarCustomizerProps {
  options: AvatarOptions;
  onSave: (newOptions: AvatarOptions) => void;
  onClose: () => void;
}

/**
 * Ensure certain fields are arrays so the UI + Avatar component can rely on .[0] and .join()
 */
const normalizeOptions = (opts: AvatarOptions): AvatarOptions => {
  const toArray = (v: any) => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [String(v)]);
  return {
    ...opts,
    hair: toArray(opts.hair),
    hairColor: toArray(opts.hairColor),
    skinColor: toArray(opts.skinColor),
    eyes: toArray(opts.eyes),
    mouth: toArray(opts.mouth),
    earrings: toArray(opts.earrings),
    glasses: toArray(opts.glasses),
    facialHair: toArray(opts.facialHair),
    baseColor: toArray(opts.baseColor),
    shirt: toArray(opts.shirt),
    // ensure probabilities are numbers (0 or 100)
    earringsProbability: typeof opts.earringsProbability === 'number' ? opts.earringsProbability : 0,
    glassesProbability: typeof opts.glassesProbability === 'number' ? opts.glassesProbability : 0,
    facialHairProbability: typeof opts.facialHairProbability === 'number' ? opts.facialHairProbability : 0,
  };
};

const AvatarCustomizer: React.FC<AvatarCustomizerProps> = ({ options, onSave, onClose }) => {
  const [tempOptions, setTempOptions] = useState<AvatarOptions>(() => normalizeOptions(options));

  const handleRandomize = () => {
    const randomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const randomBool = () => Math.random() > 0.5;

    setTempOptions(prev => ({
      ...prev,
      hair: [randomItem(avatarCustomizationOptions.hair)],
      hairColor: [randomItem(avatarCustomizationOptions.hairColor)],
      skinColor: [randomItem(avatarCustomizationOptions.skinColor)],
      eyes: [randomItem(avatarCustomizationOptions.eyes)],
      mouth: [randomItem(avatarCustomizationOptions.mouths)],
      baseColor: [randomItem(avatarCustomizationOptions.clothingColor)],
      shirt: [randomItem(avatarCustomizationOptions.shirt)],
      earringsProbability: randomBool() ? 100 : 0,
      glassesProbability: randomBool() ? 100 : 0,
      facialHairProbability: randomBool() ? 100 : 0,
    }));
  };
  
  const handleSave = () => {
    onSave(tempOptions);
    onClose();
  };

  const selectStyle = "w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none capitalize text-sm";
  const labelStyle = "block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold">Customize Your Avatar</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-1"><XCircleIcon className="w-6 h-6"/></Button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Preview */}
            <div className="md:col-span-1 flex flex-col items-center justify-center">
              <div className="w-48 h-48 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center shadow-inner mb-4">
                <Avatar avatarOptions={tempOptions} className="w-44 h-44" />
              </div>
              <Button onClick={handleRandomize} variant="secondary" className="w-full">Randomize</Button>
            </div>

            {/* Controls */}
            <div className="w-full md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {/* Skin Color */}
              <div>
                <label className={labelStyle}>Skin Tone</label>
                <div className="grid grid-cols-6 gap-2">
                  {avatarCustomizationOptions.skinColor.map(color => (
                    <button
                      key={color}
                      style={{ backgroundColor: `#${color}` }}
                      onClick={() => setTempOptions(prev => ({...prev, skinColor: [color]}))}
                      className={`w-full h-8 rounded-md border-2 ${tempOptions.skinColor?.[0] === color ? 'border-emerald-500 ring-2 ring-emerald-500' : 'border-transparent'}`}
                    />
                  ))}
                </div>
              </div>

               {/* Hair Color */}
              <div>
                <label className={labelStyle}>Hair Color</label>
                <div className="grid grid-cols-6 gap-2">
                  {avatarCustomizationOptions.hairColor.map(color => (
                    <button
                      key={color}
                      style={{ backgroundColor: `#${color}` }}
                      onClick={() => setTempOptions(prev => ({...prev, hairColor: [color]}))}
                      className={`w-full h-8 rounded-md border-2 ${tempOptions.hairColor?.[0] === color ? 'border-emerald-500 ring-2 ring-emerald-500' : 'border-transparent'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Hair Style */}
              <div>
                <label className={labelStyle}>Hair Style</label>
                <select value={tempOptions.hair?.[0] ?? ''} onChange={e => setTempOptions(prev => ({...prev, hair: [e.target.value]}))} className={selectStyle}>
                    {avatarCustomizationOptions.hair.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>

               {/* Facial Hair */}
              <div>
                 <label className={labelStyle}>Facial Hair</label>
                <label className="inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={tempOptions.facialHairProbability === 100} onChange={e => setTempOptions(prev => ({...prev, facialHairProbability: e.target.checked ? 100 : 0}))} className="sr-only peer" />
                  <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                  <span className="ms-3 text-sm font-medium text-slate-900 dark:text-slate-300">Enabled</span>
                </label>
              </div>

               {/* Eyes */}
              <div>
                <label className={labelStyle}>Eyes</label>
                <select value={tempOptions.eyes?.[0] ?? ''} onChange={e => setTempOptions(prev => ({...prev, eyes: [e.target.value]}))} className={selectStyle}>
                    {avatarCustomizationOptions.eyes.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>

               {/* Mouth */}
              <div>
                <label className={labelStyle}>Mouth</label>
                <select value={tempOptions.mouth?.[0] ?? ''} onChange={e => setTempOptions(prev => ({...prev, mouth: [e.target.value]}))} className={selectStyle}>
                    {avatarCustomizationOptions.mouths.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>

               {/* Glasses */}
              <div>
                 <label className={labelStyle}>Glasses</label>
                <label className="inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={tempOptions.glassesProbability === 100} onChange={e => setTempOptions(prev => ({...prev, glassesProbability: e.target.checked ? 100 : 0}))} className="sr-only peer" />
                  <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                  <span className="ms-3 text-sm font-medium text-slate-900 dark:text-slate-300">Enabled</span>
                </label>
              </div>

              {/* Earrings */}
               <div>
                 <label className={labelStyle}>Earrings</label>
                <label className="inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={tempOptions.earringsProbability === 100} onChange={e => setTempOptions(prev => ({...prev, earringsProbability: e.target.checked ? 100 : 0}))} className="sr-only peer" />
                  <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                  <span className="ms-3 text-sm font-medium text-slate-900 dark:text-slate-300">Enabled</span>
                </label>
              </div>
              
              {/* Clothing Color */}
               <div className="sm:col-span-2">
                <label className={labelStyle}>Clothing Color</label>
                <div className="grid grid-cols-6 gap-2">
                  {avatarCustomizationOptions.clothingColor.map(color => (
                    <button
                      key={color}
                      style={{ backgroundColor: `#${color}` }}
                      onClick={() => setTempOptions(prev => ({...prev, baseColor: [color]}))}
                      className={`w-full h-8 rounded-md border-2 ${tempOptions.baseColor?.[0] === color ? 'border-emerald-500 ring-2 ring-emerald-500' : 'border-transparent'}`}
                    />
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        <footer className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </footer>
      </div>
    </div>
  );
};

export default AvatarCustomizer;
