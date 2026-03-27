#!/bin/bash
# Direct PDF URLs for remaining articles

declare -A URLS=(
    ["www.science.org_doi_10.1126_sciadv_aaz6596.pdf"]="https://www.science.org/doi/pdf/10.1126/sciadv.aaz6596"
    ["www.tandfonline.com_doi_abs_10.1080_14659891_2024.2374797.pdf"]="https://www.tandfonline.com/doi/pdf/10.1080/14659891.2024.2374797"
    ["www.mdpi.com_1648-9144_61_4_619.pdf"]="https://www.mdpi.com/1648-9144/61/4/619/pdf"
    ["papers.ssrn.com_sol3_papers.cfm-abstract_id-5228728.pdf"]="https://papers.ssrn.com/sol3/Delivery.cfm/SSRN_ID5228728_code2598623.pdf?abstractid=5228728&mirrorid=1"
    ["www.mcpdigitalhealth.org_article_S2949-7612.pdf"]="https://www.mcpdigitalhealth.org/article/S2949-7612/pdf/"
    ["findahelpline.com.pdf"]=""  # likely no PDF available
)

for pdf in "${!URLS[@]}"; do
    url="${URLS[$pdf]}"
    [ -z "$url" ] && continue
    [ -s "$pdf" ] && echo "✓ $pdf exists" && continue
    echo "Downloading $pdf from $url"
    curl -s -L -A "Mozilla/5.0" -o "${pdf}.tmp" "$url"
    if [ -s "${pdf}.tmp" ] && file "${pdf}.tmp}" | grep -q PDF; then
        mv "${pdf}.tmp" "$pdf"
        echo "  ✓ Success ($(du -h $pdf | cut -f1))"
    else
        echo "  ✗ Failed or not PDF"
        rm -f "${pdf}.tmp"
    fi
    sleep 1
done
