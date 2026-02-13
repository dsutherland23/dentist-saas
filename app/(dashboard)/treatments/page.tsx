"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Search, MoreHorizontal, Clock, DollarSign, Activity, Loader2, Sparkles, Filter, Trash2, Pencil, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function TreatmentsPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [treatments, setTreatments] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingTreatment, setEditingTreatment] = useState<any>(null)

    const [formData, setFormData] = useState({
        name: "",
        category: "General",
        duration_minutes: 30,
        price: 0,
        description: ""
    })

    const fetchTreatments = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/treatments')
            if (res.ok) {
                const data = await res.json()
                setTreatments(data)
            }
        } catch (error) {
            console.error("Error fetching treatments:", error)
            toast.error("Failed to load treatments")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchTreatments()
    }, [])

    const handleSubmit = async () => {
        if (!formData.name || formData.price < 0) {
            toast.error("Please fill in required fields")
            return
        }

        setIsSubmitting(true)
        try {
            const url = '/api/treatments'
            const method = editingTreatment ? 'PATCH' : 'POST'
            const body = editingTreatment
                ? { id: editingTreatment.id, ...formData }
                : formData

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                toast.success(editingTreatment ? "Treatment updated" : "Treatment created")
                setIsDialogOpen(false)
                setEditingTreatment(null)
                setFormData({
                    name: "",
                    category: "General",
                    duration_minutes: 30,
                    price: 0,
                    description: ""
                })
                fetchTreatments()
            } else {
                throw new Error("Failed to save treatment")
            }
        } catch (error) {
            toast.error("Error saving treatment")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this treatment?")) return

        try {
            const res = await fetch(`/api/treatments?id=${id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                toast.success("Treatment deleted")
                fetchTreatments()
            }
        } catch (error) {
            toast.error("Error deleting treatment")
        }
    }

    const toggleStatus = async (treatment: any) => {
        try {
            const res = await fetch('/api/treatments', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: treatment.id, is_active: !treatment.is_active })
            })

            if (res.ok) {
                toast.success(`Treatment ${treatment.is_active ? 'deactivated' : 'activated'}`)
                fetchTreatments()
            }
        } catch (error) {
            toast.error("Error updating status")
        }
    }

    const filteredTreatments = treatments.filter(treatment =>
        treatment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        treatment.category?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const stats = {
        total: treatments.length,
        avgPrice: treatments.length > 0 ? treatments.reduce((acc, curr) => acc + Number(curr.price), 0) / treatments.length : 0,
        avgDuration: treatments.length > 0 ? treatments.reduce((acc, curr) => acc + curr.duration_minutes, 0) / treatments.length : 0,
        activeCount: treatments.filter(t => t.is_active).length
    }

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        )
    }

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Treatments & Services</h1>
                    <p className="text-slate-500 mt-1">Manage procedure types, durations, and pricing</p>
                </div>
                <div className="flex gap-3">
                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open)
                        if (!open) {
                            setEditingTreatment(null)
                            setFormData({
                                name: "",
                                category: "General",
                                duration_minutes: 30,
                                price: 0,
                                description: ""
                            })
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/20">
                                <Plus className="mr-2 h-4 w-4" />
                                New Treatment
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>{editingTreatment ? "Edit Treatment" : "Add New Treatment"}</DialogTitle>
                                <DialogDescription>
                                    Define procedure details, pricing, and timing.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Treatment Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Tooth Extraction"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="category">Category</Label>
                                        <Select
                                            value={formData.category}
                                            onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                                        >
                                            <SelectTrigger id="category">
                                                <SelectValue placeholder="Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="General">General</SelectItem>
                                                <SelectItem value="Cosmetic">Cosmetic</SelectItem>
                                                <SelectItem value="Orthodontic">Orthodontic</SelectItem>
                                                <SelectItem value="Surgery">Surgery</SelectItem>
                                                <SelectItem value="Hygiene">Hygiene</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="duration">Duration (mins)</Label>
                                        <Input
                                            id="duration"
                                            type="number"
                                            value={formData.duration_minutes}
                                            onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="price">Price ($)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Service details..."
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleSubmit} disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingTreatment ? "Update" : "Save"} Treatment
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-teal-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Services</CardTitle>
                        <Activity className="h-4 w-4 text-teal-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-slate-500 mt-1">{stats.activeCount} currently active</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Price</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.avgPrice.toFixed(2)}</div>
                        <p className="text-xs text-slate-500 mt-1">Per procedure</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
                        <Clock className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{Math.round(stats.avgDuration)} min</div>
                        <p className="text-xs text-slate-500 mt-1">Time allocation</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reliability</CardTitle>
                        <Sparkles className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">100%</div>
                        <p className="text-xs text-slate-500 mt-1">Data synchronized</p>
                    </CardContent>
                </Card>
            </div>

            {/* Treatments Table */}
            <Card className="shadow-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Catalog</CardTitle>
                            <CardDescription>Available dental procedures and costs</CardDescription>
                        </div>
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search treatments..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Treatment Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTreatments.map((treatment) => (
                                <TableRow key={treatment.id} className="hover:bg-slate-50 transition-colors">
                                    <TableCell className="font-medium text-slate-900">
                                        {treatment.name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-slate-50">
                                            {treatment.category || "General"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Clock className="h-3 w-3" />
                                            {treatment.duration_minutes} min
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold text-teal-600">
                                        ${Number(treatment.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={treatment.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}>
                                            {treatment.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => {
                                                    setEditingTreatment(treatment)
                                                    setFormData({
                                                        name: treatment.name,
                                                        category: treatment.category || "General",
                                                        duration_minutes: treatment.duration_minutes,
                                                        price: treatment.price,
                                                        description: treatment.description || ""
                                                    })
                                                    setIsDialogOpen(true)
                                                }}>
                                                    <Pencil className="h-4 w-4 mr-2" /> Edit Treatment
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => toggleStatus(treatment)}>
                                                    {treatment.is_active ? (
                                                        <><XCircle className="h-4 w-4 mr-2" /> Deactivate</>
                                                    ) : (
                                                        <><CheckCircle2 className="h-4 w-4 mr-2" /> Activate</>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-600"
                                                    onClick={() => handleDelete(treatment.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {filteredTreatments.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                        No treatments found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
